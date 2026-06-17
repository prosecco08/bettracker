import pg from 'pg'

const { Pool } = pg

let pool
let schemaReady = false

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL')
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }

  return pool
}

export async function query(text, params = []) {
  await ensureSchema()
  return getPool().query(text, params)
}

export async function rawQuery(text, params = []) {
  return getPool().query(text, params)
}

export async function ensureSchema() {
  if (schemaReady) return

  await rawQuery(`
    create table if not exists profiles (
      id text primary key,
      username text unique not null,
      avatar_color text default '#7F77DD',
      created_at timestamptz default now()
    );

    create table if not exists matches (
      id text primary key,
      external_id text unique,
      competition_code text not null,
      competition_label text,
      competition_name text,
      home_team text not null,
      away_team text not null,
      utc_date timestamptz not null,
      status text default 'SCHEDULED',
      home_score int,
      away_score int,
      updated_at timestamptz default now()
    );

    create table if not exists schedine (
      id text primary key,
      user_id text not null references profiles(id) on delete cascade,
      match_id text references matches(id),
      campionato text not null,
      campionato_label text not null,
      partita text not null,
      data_partita timestamptz not null,
      pronostico text not null,
      puntata numeric(10,2) not null,
      quota numeric(10,2) not null,
      vincita_potenziale numeric(10,2) not null,
      stato text default 'in_corso',
      profitto numeric(10,2) default 0,
      auto_closed_at timestamptz,
      auto_close_reason text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create table if not exists user_goals (
      id text primary key,
      user_id text not null references profiles(id) on delete cascade,
      month int not null,
      year int not null,
      target_profit numeric(10,2) not null,
      updated_at timestamptz default now(),
      unique (user_id, month, year)
    );

    create table if not exists friendships (
      id text primary key,
      requester_id text not null references profiles(id) on delete cascade,
      addressee_id text not null references profiles(id) on delete cascade,
      status text default 'pending',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create index if not exists schedine_user_idx on schedine(user_id);
    create index if not exists schedine_match_status_idx on schedine(match_id, stato);
    create index if not exists matches_competition_idx on matches(competition_code, utc_date);
  `)

  schemaReady = true
}
