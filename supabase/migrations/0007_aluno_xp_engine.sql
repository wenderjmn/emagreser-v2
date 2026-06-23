-- 0007 — XP engine: unique constraint em user_missions, INSERT policies
--        para xp_transactions/user_badges, e função complete_mission().
-- Ver docs/spec-fase1-multitenant.md §3.3 (gamificação).

-- 1. Unique constraint para o ON CONFLICT na função de conclusão de missão.
alter table public.user_missions
  add constraint user_missions_user_mission_unique
  unique (user_id, mission_id);

-- 2. INSERT policies que faltavam.
create policy xp_own_insert on public.xp_transactions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy badges_own_insert on public.user_badges
  for insert to authenticated
  with check (user_id = auth.uid());

-- 3. Função complete_mission: atômica, security definer para escrever
--    em xp_transactions e user_badges sem depender de políticas adicionais.
create or replace function public.complete_mission(
  p_user_id  uuid,
  p_mission_id uuid,
  p_content  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp_reward        int;
  v_week_id          uuid;
  v_new_xp           int;
  v_new_streak       int;
  v_missions_total   int;
  v_req_in_week      int;
  v_done_in_week     int;
  v_weeks_completed  int;
  v_badges_awarded   jsonb := '[]'::jsonb;
  v_badge            record;
  v_earned           boolean;
begin
  -- Segurança: apenas o próprio usuário pode completar suas missões.
  if auth.uid() != p_user_id then
    raise exception 'Unauthorized';
  end if;

  -- Idempotente: não faz nada se já concluída.
  if exists (
    select 1 from user_missions
    where user_id = p_user_id and mission_id = p_mission_id and status = 'completed'
  ) then
    return jsonb_build_object('already_completed', true, 'xp_earned', 0, 'badges_awarded', '[]'::jsonb);
  end if;

  -- Dados da missão.
  select xp_reward, week_id into v_xp_reward, v_week_id
  from missions where id = p_mission_id;

  if v_xp_reward is null then
    raise exception 'Mission not found: %', p_mission_id;
  end if;

  -- Registra conclusão da missão.
  insert into user_missions (user_id, mission_id, status, completed_at, content, xp_earned)
  values (p_user_id, p_mission_id, 'completed', now(), p_content, v_xp_reward)
  on conflict (user_id, mission_id)
  do update set status = 'completed', completed_at = now(), content = p_content, xp_earned = v_xp_reward;

  -- Transação de XP.
  insert into xp_transactions (user_id, amount, reason, source_type, source_id)
  values (p_user_id, v_xp_reward, 'Missão concluída', 'mission', p_mission_id);

  -- Atualiza perfil: XP, level (500 XP por nível), streak.
  update users_profile
  set
    total_xp      = total_xp + v_xp_reward,
    current_level = greatest(1, (total_xp + v_xp_reward) / 500 + 1),
    streak_days   = case
                      when streak_last_date = current_date then streak_days
                      when streak_last_date = current_date - 1 then streak_days + 1
                      else 1
                    end,
    streak_record = greatest(
                      streak_record,
                      case
                        when streak_last_date = current_date then streak_days
                        when streak_last_date = current_date - 1 then streak_days + 1
                        else 1
                      end
                    ),
    streak_last_date = current_date
  where id = p_user_id
  returning total_xp, streak_days into v_new_xp, v_new_streak;

  -- Contagens para verificação de badges.
  select count(*) into v_missions_total
  from user_missions where user_id = p_user_id and status = 'completed';

  if v_week_id is not null then
    select count(*) into v_req_in_week
    from missions where week_id = v_week_id and required = true;

    select count(*) into v_done_in_week
    from user_missions um
    join missions m on m.id = um.mission_id
    where um.user_id = p_user_id and um.status = 'completed' and m.week_id = v_week_id and m.required = true;
  end if;

  -- Semanas com todas as missões obrigatórias concluídas.
  select count(distinct w.id) into v_weeks_completed
  from weeks w
  where not exists (
    select 1 from missions m
    left join user_missions um
      on um.mission_id = m.id and um.user_id = p_user_id and um.status = 'completed'
    where m.week_id = w.id and m.required = true and um.id is null
  );

  -- Verifica e concede badges ainda não conquistados.
  for v_badge in
    select b.* from badges b
    where not exists (
      select 1 from user_badges ub
      where ub.user_id = p_user_id and ub.badge_id = b.id
    )
  loop
    v_earned := false;

    case v_badge.condition_type
      when 'total_xp'          then v_earned := v_new_xp >= v_badge.condition_value;
      when 'missions_completed' then v_earned := v_missions_total >= v_badge.condition_value;
      when 'streak_days'        then v_earned := v_new_streak >= v_badge.condition_value;
      when 'week_completed'     then v_earned := v_weeks_completed >= v_badge.condition_value;
      when 'week_100pct'        then
        v_earned := v_week_id is not null
                    and v_req_in_week > 0
                    and v_done_in_week >= v_req_in_week
                    and v_weeks_completed >= v_badge.condition_value;
      else v_earned := false;
    end case;

    if v_earned then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge.id)
      on conflict do nothing;

      insert into xp_transactions (user_id, amount, reason, source_type, source_id)
      values (p_user_id, v_badge.xp_reward, 'Badge: ' || v_badge.name, 'badge', v_badge.id);

      update users_profile
      set total_xp      = total_xp + v_badge.xp_reward,
          current_level = greatest(1, (total_xp + v_badge.xp_reward) / 500 + 1)
      where id = p_user_id;

      v_badges_awarded := v_badges_awarded || jsonb_build_array(
        jsonb_build_object('name', v_badge.name, 'emoji', v_badge.emoji, 'xp', v_badge.xp_reward)
      );
    end if;
  end loop;

  return jsonb_build_object(
    'xp_earned',      v_xp_reward,
    'total_xp',       v_new_xp,
    'streak_days',    v_new_streak,
    'badges_awarded', v_badges_awarded
  );
end;
$$;

grant execute on function public.complete_mission to authenticated;
