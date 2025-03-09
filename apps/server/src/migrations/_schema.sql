CREATE TYPE public.prompt_type AS ENUM (
    'user',
    'system',
    'tool'
);

CREATE TABLE public.effect_sql_migrations (
    migration_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL
);

CREATE TABLE public.prompt_types (
    id integer NOT NULL,
    type public.prompt_type NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.prompt_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.prompt_types_id_seq OWNED BY public.prompt_types.id;

CREATE TABLE public.prompts (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    type public.prompt_type NOT NULL,
    prompt text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL
);

CREATE SEQUENCE public.prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.prompts_id_seq OWNED BY public.prompts.id;

CREATE TABLE public.users (
    id integer NOT NULL,
    firstname character varying(255) NOT NULL,
    fullname character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    type character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_type_check CHECK (((type)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.prompt_types ALTER COLUMN id SET DEFAULT nextval('public.prompt_types_id_seq'::regclass);

ALTER TABLE ONLY public.prompts ALTER COLUMN id SET DEFAULT nextval('public.prompts_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

ALTER TABLE ONLY public.effect_sql_migrations
    ADD CONSTRAINT effect_sql_migrations_pkey PRIMARY KEY (migration_id);

ALTER TABLE ONLY public.prompt_types
    ADD CONSTRAINT prompt_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.prompt_types
    ADD CONSTRAINT prompt_types_type_key UNIQUE (type);

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE INDEX idx_prompts_tags ON public.prompts USING gin (tags);

CREATE INDEX idx_prompts_type ON public.prompts USING btree (type);

CREATE INDEX idx_users_email ON public.users USING btree (email);

INSERT INTO public.effect_sql_migrations (migration_id, created_at, name) VALUES (1, '2025-03-05 13:20:08.055591-05', 'create_tables');
INSERT INTO public.effect_sql_migrations (migration_id, created_at, name) VALUES (2, '2025-03-05 13:20:08.055591-05', 'create_users_table');