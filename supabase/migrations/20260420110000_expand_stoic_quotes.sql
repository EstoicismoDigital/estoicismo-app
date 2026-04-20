-- supabase/migrations/20260420110000_expand_stoic_quotes.sql
-- 1) Adds 40 additional Spanish stoic quotes with real attributions.
-- 2) Adds a deterministic get_daily_quote(p_language, p_seed) RPC.
--
-- Quotes are inserted via NOT EXISTS guards on (text, language) so the
-- migration is idempotent and coexists with the existing seed.sql rows.

-- ---------------------------------------------------------------------------
-- 1. Quote inserts (40 new rows, all Spanish)
-- ---------------------------------------------------------------------------

-- Marco Aurelio — Meditaciones
INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Al amanecer, cuando te cueste levantarte, ten a mano este pensamiento: me levanto para hacer el trabajo propio del hombre.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Al amanecer, cuando te cueste levantarte, ten a mano este pensamiento: me levanto para hacer el trabajo propio del hombre.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'El universo es cambio; nuestra vida es lo que nuestros pensamientos hacen de ella.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'El universo es cambio; nuestra vida es lo que nuestros pensamientos hacen de ella.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Lo que obstaculiza la acción, hace avanzar la acción. Lo que se interpone en el camino, se convierte en el camino.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Lo que obstaculiza la acción, hace avanzar la acción. Lo que se interpone en el camino, se convierte en el camino.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Si algo externo te aflige, no es esa cosa la que te perturba, sino tu juicio sobre ella; y está en tu poder cambiarlo.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Si algo externo te aflige, no es esa cosa la que te perturba, sino tu juicio sobre ella; y está en tu poder cambiarlo.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Cuán ridículo y extraño resulta sorprenderse de cualquier cosa que ocurra en la vida.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Cuán ridículo y extraño resulta sorprenderse de cualquier cosa que ocurra en la vida.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Haz cada acto de tu vida como si fuera el último.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Haz cada acto de tu vida como si fuera el último.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'En poco tiempo lo habrás olvidado todo; en poco tiempo todos te habrán olvidado.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'En poco tiempo lo habrás olvidado todo; en poco tiempo todos te habrán olvidado.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'La mejor venganza es no parecerte a quien te ofendió.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'La mejor venganza es no parecerte a quien te ofendió.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Confina tu atención al presente. Nadie pierde otra vida que la que vive, ni vive otra que la que pierde.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Confina tu atención al presente. Nadie pierde otra vida que la que vive, ni vive otra que la que pierde.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Retírate dentro de ti mismo: en tu propia alma está el refugio más tranquilo.', 'Marco Aurelio', 'Meditaciones', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Retírate dentro de ti mismo: en tu propia alma está el refugio más tranquilo.' AND language = 'es');

-- Epicteto — Enquiridion / Discursos
INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Algunas cosas dependen de nosotros y otras no. De nosotros dependen la opinión, el deseo y la aversión; el resto no.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Algunas cosas dependen de nosotros y otras no. De nosotros dependen la opinión, el deseo y la aversión; el resto no.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'No son las cosas las que perturban al hombre, sino las opiniones que se forma sobre ellas.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'No son las cosas las que perturban al hombre, sino las opiniones que se forma sobre ellas.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'No pidas que las cosas sucedan como deseas; desea que sucedan como suceden y serás feliz.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'No pidas que las cosas sucedan como deseas; desea que sucedan como suceden y serás feliz.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Recuerda que eres un actor en una obra y que el papel lo decide el autor; a ti te toca representarlo bien.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Recuerda que eres un actor en una obra y que el papel lo decide el autor; a ti te toca representarlo bien.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Nunca digas de nada: lo he perdido. Di más bien: lo he devuelto.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Nunca digas de nada: lo he perdido. Di más bien: lo he devuelto.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Si quieres progresar, resígnate a parecer necio e insensato en lo exterior.', 'Epicteto', 'Enquiridion', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Si quieres progresar, resígnate a parecer necio e insensato en lo exterior.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'No es pobre quien tiene poco, sino quien mucho desea.', 'Epicteto', 'Discursos', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'No es pobre quien tiene poco, sino quien mucho desea.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Primero dite a ti mismo qué quieres ser; luego haz lo que debas hacer.', 'Epicteto', 'Discursos', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Primero dite a ti mismo qué quieres ser; luego haz lo que debas hacer.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Tenemos dos orejas y una sola boca para escuchar el doble y hablar la mitad.', 'Epicteto', 'Fragmentos', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Tenemos dos orejas y una sola boca para escuchar el doble y hablar la mitad.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Ningún hombre es libre si no es dueño de sí mismo.', 'Epicteto', 'Discursos', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Ningún hombre es libre si no es dueño de sí mismo.' AND language = 'es');

-- Séneca — Cartas a Lucilio / De brevitate vitae / De ira / De vita beata
INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Todo nos es ajeno, sólo el tiempo es nuestro.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Todo nos es ajeno, sólo el tiempo es nuestro.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Mientras esperamos vivir, la vida pasa.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Mientras esperamos vivir, la vida pasa.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Sufrimos más en la imaginación que en la realidad.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Sufrimos más en la imaginación que en la realidad.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'La mayor parte de la vida se pasa errando; una gran parte, sin hacer nada, y casi toda ella haciendo lo que no debemos.', 'Séneca', 'Sobre la brevedad de la vida', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'La mayor parte de la vida se pasa errando; una gran parte, sin hacer nada, y casi toda ella haciendo lo que no debemos.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'No nos atrevemos a muchas cosas porque son difíciles; son difíciles porque no nos atrevemos.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'No nos atrevemos a muchas cosas porque son difíciles; son difíciles porque no nos atrevemos.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'La ira es una locura breve.', 'Séneca', 'Sobre la ira', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'La ira es una locura breve.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Mientras enseñamos, aprendemos.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Mientras enseñamos, aprendemos.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'La vida, si sabes usarla, es larga.', 'Séneca', 'Sobre la brevedad de la vida', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'La vida, si sabes usarla, es larga.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Donde hay un ser humano, hay una oportunidad para un acto de bondad.', 'Séneca', 'Sobre la vida feliz', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Donde hay un ser humano, hay una oportunidad para un acto de bondad.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Si quieres ser amado, ama.', 'Séneca', 'Cartas a Lucilio', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Si quieres ser amado, ama.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Toda crueldad nace de la debilidad.', 'Séneca', 'Sobre la ira', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Toda crueldad nace de la debilidad.' AND language = 'es');

-- Musonio Rufo — Diatribas / Fragmentos
INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'No buscamos la virtud para gozar de ella, sino que gozamos por ser virtuosos.', 'Musonio Rufo', 'Diatribas', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'No buscamos la virtud para gozar de ella, sino que gozamos por ser virtuosos.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Acostumbrarse a la vida dura hace fácil soportar la vida.', 'Musonio Rufo', 'Diatribas', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Acostumbrarse a la vida dura hace fácil soportar la vida.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Filosofía no es más que el cuidado por vivir correctamente.', 'Musonio Rufo', 'Fragmentos', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Filosofía no es más que el cuidado por vivir correctamente.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'El que desea aprender a vivir debe practicar cada día, como quien ejercita el cuerpo.', 'Musonio Rufo', 'Diatribas', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'El que desea aprender a vivir debe practicar cada día, como quien ejercita el cuerpo.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Si logras hacer algo difícil con esfuerzo, el esfuerzo pasa y lo bien hecho permanece; si haces algo vergonzoso por placer, el placer pasa y la vergüenza permanece.', 'Musonio Rufo', 'Diatribas', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Si logras hacer algo difícil con esfuerzo, el esfuerzo pasa y lo bien hecho permanece; si haces algo vergonzoso por placer, el placer pasa y la vergüenza permanece.' AND language = 'es');

-- Zenón de Citio — reportado por Diógenes Laercio
INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'El fin es vivir conforme a la naturaleza.', 'Zenón de Citio', 'Diógenes Laercio, Vidas VII', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'El fin es vivir conforme a la naturaleza.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'El bienestar se alcanza poco a poco, y no es, sin embargo, cosa de poca monta.', 'Zenón de Citio', 'Diógenes Laercio, Vidas VII', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'El bienestar se alcanza poco a poco, y no es, sin embargo, cosa de poca monta.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'Mejor tropezar con los pies que con la lengua.', 'Zenón de Citio', 'Diógenes Laercio, Vidas VII', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'Mejor tropezar con los pies que con la lengua.' AND language = 'es');

INSERT INTO public.stoic_quotes (text, author, source, language)
SELECT 'La felicidad consiste en un buen flujo de la vida.', 'Zenón de Citio', 'Diógenes Laercio, Vidas VII', 'es'
WHERE NOT EXISTS (SELECT 1 FROM public.stoic_quotes WHERE text = 'La felicidad consiste en un buen flujo de la vida.' AND language = 'es');

-- ---------------------------------------------------------------------------
-- 2. get_daily_quote RPC — deterministic by seed (day-of-year by default)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_daily_quote(
  p_language TEXT DEFAULT 'es',
  p_seed INT DEFAULT NULL
)
RETURNS TABLE(text TEXT, author TEXT)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
  v_seed  INT;
  v_index INT;
BEGIN
  -- Default seed: day of year (1..366). Always non-negative.
  IF p_seed IS NULL THEN
    v_seed := EXTRACT(DOY FROM CURRENT_DATE)::INT;
  ELSE
    v_seed := p_seed;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.stoic_quotes q
  WHERE q.language = p_language;

  IF v_count = 0 THEN
    RETURN;
  END IF;

  -- Normalise seed into [0, v_count) even if the caller passes negatives.
  v_index := ((v_seed % v_count) + v_count) % v_count;

  RETURN QUERY
  SELECT q.text, q.author
  FROM public.stoic_quotes q
  WHERE q.language = p_language
  ORDER BY q.id
  OFFSET v_index
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_quote(TEXT, INT) TO anon, authenticated;
