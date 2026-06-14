ALTER TABLE "public"."services" ADD COLUMN "target_gender" text NOT NULL DEFAULT 'ambos';
ALTER TABLE "public"."appointments" ADD COLUMN "client_gender" text;

-- Asegurarse de que target_gender solo sea 'hombres', 'mujeres' o 'ambos'
ALTER TABLE "public"."services" ADD CONSTRAINT check_target_gender CHECK (target_gender IN ('hombres', 'mujeres', 'ambos'));

-- Asegurarse de que client_gender solo sea 'hombre' o 'mujer' o nulo
ALTER TABLE "public"."appointments" ADD CONSTRAINT check_client_gender CHECK (client_gender IN ('hombre', 'mujer'));
