-- Run in Supabase SQL editor
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  balance numeric not null default 0,
  created_at timestamptz default now()
);
create table if not exists holdings (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  symbol text not null,
  amount numeric not null default 0
);
create table if not exists watchlist (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  symbol text not null,
  unique (user_id, symbol)
);
create table if not exists bots (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  name text, description text, schedule text, risk text,
  status text default 'Not Configured',
  pnl numeric default 0, wins int default 0, losses int default 0, allocated numeric default 0
);
create table if not exists trades (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  market text, contract text, stake numeric, result text, payout numeric,
  created_at timestamptz default now()
);

alter table profiles  enable row level security;
alter table holdings  enable row level security;
alter table watchlist enable row level security;
alter table bots      enable row level security;
alter table trades    enable row level security;

create policy "own profile read"   on profiles  for select using (auth.uid() = id);
create policy "own profile update" on profiles  for update using (auth.uid() = id);
create policy "own holdings"  on holdings  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own watchlist" on watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bots"      on bots      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trades"    on trades    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- New user: profile + starter bots + watchlist
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, username) values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)));
  insert into bots (user_id, name, description, schedule, risk) values
    (new.id, 'Bitcoin Accumulation', 'Dollar-cost averaging into Bitcoin on a weekly basis.', 'Weekly', 'Low'),
    (new.id, 'ETH DCA Pro', 'Dynamic DCA based on RSI and volume indicators.', 'Daily', 'Medium');
  insert into watchlist (user_id, symbol) values (new.id,'BTC'),(new.id,'ETH'),(new.id,'XRP');
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
