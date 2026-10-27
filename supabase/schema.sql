-- ==============================================================================
-- PelviCoach Supabase Database Schema
-- Simple. Guided. Personalized.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'clinician')),
    patient_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. Create CARE_LINKS Table (Connects Patients with Clinicians)
CREATE TABLE IF NOT EXISTS public.care_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(patient_id, clinician_id)
);

-- 4. Create EXERCISES Table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    video_url TEXT,
    video_filename TEXT,
    duration TEXT NOT NULL DEFAULT '5 min',
    difficulty TEXT NOT NULL DEFAULT 'Beginner',
    default_target INTEGER NOT NULL DEFAULT 65,
    default_hold INTEGER NOT NULL DEFAULT 5,
    default_repetitions INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 5. Create PATIENT_EXERCISES Table (Custom Targets assigned to Patient)
CREATE TABLE IF NOT EXISTS public.patient_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    target_percentage INTEGER NOT NULL DEFAULT 65,
    hold_seconds INTEGER NOT NULL DEFAULT 5,
    goal_repetitions INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(patient_id, exercise_id)
);

-- 6. Create SESSIONS Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    end_time TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    total_repetitions INTEGER NOT NULL DEFAULT 0,
    successful_repetitions INTEGER NOT NULL DEFAULT 0,
    missed_repetitions INTEGER NOT NULL DEFAULT 0,
    compensated_repetitions INTEGER NOT NULL DEFAULT 0,
    invalid_repetitions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 7. Create ATTEMPTS Table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    rep_number INTEGER NOT NULL DEFAULT 1,
    result TEXT NOT NULL CHECK (result IN ('OK', 'MISS', 'COMPENSATED', 'INVALID')),
    target_percentage INTEGER NOT NULL,
    pelvic_activity INTEGER NOT NULL,
    abdominal_activity INTEGER NOT NULL,
    hold_seconds NUMERIC(4, 1) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_code ON public.profiles(patient_code);
CREATE INDEX IF NOT EXISTS idx_care_links_clinician ON public.care_links(clinician_id);
CREATE INDEX IF NOT EXISTS idx_care_links_patient ON public.care_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_patient ON public.patient_exercises(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.attempts(session_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own or linked patients/clinicians
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Clinicians can read linked patient profiles"
    ON public.profiles FOR SELECT
    USING (id IN (SELECT patient_id FROM public.care_links WHERE clinician_id = auth.uid()));

CREATE POLICY "Patients can read linked clinician profile"
    ON public.profiles FOR SELECT
    USING (id IN (SELECT clinician_id FROM public.care_links WHERE patient_id = auth.uid()));

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Care Links
CREATE POLICY "Clinicians view their care links"
    ON public.care_links FOR SELECT
    USING (clinician_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY "Clinicians insert care links"
    ON public.care_links FOR INSERT
    WITH CHECK (clinician_id = auth.uid());

-- Exercises: Read-only for authenticated users
CREATE POLICY "Anyone can view exercises"
    ON public.exercises FOR SELECT
    TO authenticated
    USING (true);

-- Patient Exercises: Patients view own; Clinicians view & edit for linked patients
CREATE POLICY "Patients can view own training plans"
    ON public.patient_exercises FOR SELECT
    USING (patient_id = auth.uid() OR patient_id IN (SELECT patient_id FROM public.care_links WHERE clinician_id = auth.uid()));

CREATE POLICY "Patients and Clinicians can insert/update training plans"
    ON public.patient_exercises FOR ALL
    USING (patient_id = auth.uid() OR patient_id IN (SELECT patient_id FROM public.care_links WHERE clinician_id = auth.uid()));

-- Sessions
CREATE POLICY "Patients view own sessions or Clinicians view linked"
    ON public.sessions FOR SELECT
    USING (patient_id = auth.uid() OR patient_id IN (SELECT patient_id FROM public.care_links WHERE clinician_id = auth.uid()));

CREATE POLICY "Patients insert own sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (patient_id = auth.uid());

-- Attempts
CREATE POLICY "View attempts for accessible sessions"
    ON public.attempts FOR SELECT
    USING (session_id IN (
        SELECT id FROM public.sessions
        WHERE patient_id = auth.uid() OR patient_id IN (SELECT patient_id FROM public.care_links WHERE clinician_id = auth.uid())
    ));

CREATE POLICY "Patients insert attempts for own sessions"
    ON public.attempts FOR INSERT
    WITH CHECK (session_id IN (
        SELECT id FROM public.sessions WHERE patient_id = auth.uid()
    ));

-- 10. HELPER FUNCTION: Link Patient by Code
CREATE OR REPLACE FUNCTION public.link_patient_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_patient_id UUID;
    calling_clinician_id UUID;
    existing_link UUID;
    patient_name TEXT;
BEGIN
    calling_clinician_id := auth.uid();
    IF calling_clinician_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lookup patient by code
    SELECT id, name INTO target_patient_id, patient_name
    FROM public.profiles
    WHERE UPPER(TRIM(patient_code)) = UPPER(TRIM(p_code)) AND role = 'patient';

    IF target_patient_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Patient code not found.');
    END IF;

    -- Check if link already exists
    SELECT id INTO existing_link
    FROM public.care_links
    WHERE patient_id = target_patient_id AND clinician_id = calling_clinician_id;

    IF existing_link IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Patient already linked.', 'patient_name', patient_name);
    END IF;

    -- Insert care link
    INSERT INTO public.care_links (patient_id, clinician_id)
    VALUES (target_patient_id, calling_clinician_id);

    RETURN jsonb_build_object('success', true, 'message', 'Patient successfully linked!', 'patient_name', patient_name);
END;
$$;

-- 11. TRIGGER: Auto-create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    generated_code TEXT;
BEGIN
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');
    
    IF user_role = 'patient' THEN
        -- Generate readable code like PELVI-4821
        generated_code := 'PELVI-' || floor(1000 + random() * 9000)::TEXT;
    ELSE
        generated_code := NULL;
    END IF;

    INSERT INTO public.profiles (id, name, email, role, patient_code)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'PelviCoach User'),
        new.email,
        user_role,
        generated_code
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. SEED INITIAL EXERCISES
INSERT INTO public.exercises (id, name, description, instructions, video_filename, duration, difficulty, default_target, default_hold, default_repetitions)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Pelvic Floor Hold', 'Gently tighten your pelvic-floor muscles and hold steady.', 'Sit comfortably with feet flat. Gently squeeze as if stopping the flow of urine. Keep your stomach and buttocks relaxed. Hold steadily then gently release.', 'pelvic-floor-hold.mp4', '5 minutes', 'Beginner', 65, 5, 10),
    ('a0000000-0000-0000-0000-000000000002', 'Quick Contractions', 'Rapid, rhythmic tightening to strengthen quick-response muscle fibers.', 'Squeeze your pelvic floor quickly for 1 second, then release immediately for 1 second. Repeat rhythmically without holding your breath.', 'pelvic-floor-basic.mp4', '3 minutes', 'Intermediate', 70, 2, 10),
    ('a0000000-0000-0000-0000-000000000003', 'Deep Pelvic Relax', 'Gentle release and breath synchronization for muscle rest.', 'Take a slow deep breath into your belly. As you exhale, feel your pelvic floor completely soften and drop downward without straining.', 'pelvic-floor-relax.mp4', '4 minutes', 'Gentle', 50, 6, 8)
ON CONFLICT (id) DO NOTHING;
