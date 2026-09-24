-- Professional owners manage programs; administrators only moderate them.
begin;
create or replace function public.sokile_is_program_publisher() returns boolean
language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and not public.sokile_is_admin() and exists (
  select 1 from auth.users where id=auth.uid() and raw_user_meta_data->>'account_type'='pro'
 );
$$;
revoke all on function public.sokile_is_program_publisher() from public;
grant execute on function public.sokile_is_program_publisher() to authenticated;

create or replace function public.sokile_save_program(p_id uuid,p_program jsonb,p_units jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid()); v_owner uuid; v_email text; u jsonb; item jsonb; uid uuid; seen uuid[]:='{}';
begin
 if not public.sokile_is_program_publisher() then raise exception 'La gestion des programmes neufs est réservée aux professionnels.';end if;
 if auth.uid() is null then raise exception 'Connectez-vous pour déposer un programme.';end if;
 select email into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if v_email is null then raise exception 'Confirmez votre adresse email avant de déposer un programme.';end if;
 if p_id is not null then
   select owner_id into v_owner from public.development_programs where id=p_id for update;
   if not found or v_owner<>auth.uid() then raise exception 'Programme inaccessible.';end if;
   select email into v_email from auth.users where id=v_owner and email_confirmed_at is not null;
 else v_owner:=auth.uid();end if;
 if jsonb_typeof(p_program)<>'object' or jsonb_typeof(p_units)<>'array' then raise exception 'Dossier incomplet.';end if;
 if char_length(trim(coalesce(p_program->>'title',''))) not between 4 and 160 or char_length(trim(coalesce(p_program->>'developer_name',''))) not between 2 and 160
 or char_length(trim(coalesce(p_program->>'city',''))) not between 2 and 100 or char_length(trim(coalesce(p_program->>'description',''))) not between 80 and 10000 then raise exception 'Renseignez le nom, le promoteur, la ville et une description de 80 à 10 000 caractères.';end if;
 if not coalesce(p_program->>'country','')=any(array['Bénin','Burkina Faso','Côte d''Ivoire','Mali','Niger','Sénégal','Togo','Cameroun','Centrafrique','Congo','Gabon','Tchad']) then raise exception 'Choisissez un pays couvert par Sokilé.';end if;
 if coalesce(p_program->>'stage','') not in('sur_plan','construction','livre') or coalesce(p_program->>'publisher_kind','') not in('promoteur','agence') then raise exception 'Précisez le stade du projet et votre qualité professionnelle.';end if;
 if p_program->>'stage'<>'livre' and (nullif(p_program->>'delivery_quarter','') is null or nullif(p_program->>'delivery_year','') is null) then raise exception 'Précisez la livraison prévisionnelle.';end if;
 if jsonb_typeof(coalesce(p_program->'gallery','[]'))<>'array' or jsonb_array_length(coalesce(p_program->'gallery','[]'))>10 then raise exception 'Ajoutez au maximum 10 visuels.';end if;
 for item in select value from jsonb_array_elements(coalesce(p_program->'gallery','[]')) loop
   if not public.sokile_program_https(item->>'url') or coalesce(item->>'url','')='' or coalesce(item->>'kind','') not in('photo','perspective','chantier') or length(coalesce(item->>'caption',''))>200 then raise exception 'Visuel invalide : utilisez une adresse HTTPS et précisez sa nature.';end if;
 end loop;
 if not public.sokile_program_https(p_program->>'brochure_url') or not public.sokile_program_https(p_program->>'website') then raise exception 'Les documents et sites doivent utiliser une adresse HTTPS.';end if;
 if char_length(coalesce(p_program->>'phone','')) not between 6 and 40 or char_length(coalesce(p_program->>'neighborhood',''))>200 or char_length(coalesce(p_program->>'verification_reference',''))>2000 then raise exception 'Vérifiez le téléphone et les informations du dossier.';end if;
 if jsonb_array_length(p_units) not between 1 and 100 then raise exception 'Ajoutez entre 1 et 100 logements.';end if;
 if jsonb_typeof(coalesce(p_program->'amenities','[]'))<>'array' or jsonb_array_length(coalesce(p_program->'amenities','[]'))>30 then raise exception 'Équipements invalides.';end if;
 insert into public.development_programs(id,owner_id,title,developer_name,publisher_kind,country,city,neighborhood,description,stage,delivery_quarter,delivery_year,amenities,gallery,brochure_url,website,phone,email,verification_reference)
 values(v_id,v_owner,trim(p_program->>'title'),trim(p_program->>'developer_name'),p_program->>'publisher_kind',p_program->>'country',trim(p_program->>'city'),coalesce(p_program->>'neighborhood',''),trim(p_program->>'description'),p_program->>'stage',nullif(p_program->>'delivery_quarter','')::integer,nullif(p_program->>'delivery_year','')::integer,array(select jsonb_array_elements_text(coalesce(p_program->'amenities','[]'))),coalesce(p_program->'gallery','[]'),coalesce(p_program->>'brochure_url',''),coalesce(p_program->>'website',''),p_program->>'phone',v_email,coalesce(p_program->>'verification_reference',''))
 on conflict(id) do update set title=excluded.title,developer_name=excluded.developer_name,publisher_kind=excluded.publisher_kind,country=excluded.country,city=excluded.city,neighborhood=excluded.neighborhood,description=excluded.description,stage=excluded.stage,delivery_quarter=excluded.delivery_quarter,delivery_year=excluded.delivery_year,amenities=excluded.amenities,gallery=excluded.gallery,brochure_url=excluded.brochure_url,website=excluded.website,phone=excluded.phone,email=excluded.email,verification_reference=excluded.verification_reference,status='en_attente',moderation_note=null,inventory_updated_at=now(),updated_at=now();
 -- Masquage provisoire dans cette transaction : références échangeables, ids conservés.
 update public.program_units set active=false where program_id=v_id;
 for u in select value from jsonb_array_elements(p_units) loop
   uid:=coalesce(nullif(u->>'id','')::uuid,gen_random_uuid());
   if uid=any(seen) or exists(select 1 from public.program_units where id=uid and program_id<>v_id) then raise exception 'Identifiant de logement invalide.';end if;
   seen:=array_append(seen,uid);
   if char_length(trim(coalesce(u->>'reference',''))) not between 1 and 50 or char_length(coalesce(u->>'floor',''))>50 or char_length(coalesce(u->>'outdoor',''))>150 or not public.sokile_program_https(u->>'plan_url') then raise exception 'Vérifiez la référence et le plan du logement.';end if;
   insert into public.program_units(id,program_id,reference,nature,rooms,surface,price_fcfa,floor,outdoor,plan_url,availability,active)
   values(uid,v_id,trim(u->>'reference'),u->>'nature',(u->>'rooms')::integer,(u->>'surface')::numeric,nullif(u->>'price_fcfa','')::numeric,coalesce(u->>'floor',''),coalesce(u->>'outdoor',''),coalesce(u->>'plan_url',''),coalesce(u->>'availability','disponible'),true)
   on conflict(id) do update set reference=excluded.reference,nature=excluded.nature,rooms=excluded.rooms,surface=excluded.surface,price_fcfa=excluded.price_fcfa,floor=excluded.floor,outdoor=excluded.outdoor,plan_url=excluded.plan_url,availability=excluded.availability,active=true,updated_at=now();
 end loop;
 return v_id;
end $$;
revoke all on function public.sokile_save_program(uuid,jsonb,jsonb) from public;
grant execute on function public.sokile_save_program(uuid,jsonb,jsonb) to authenticated;

create or replace function public.sokile_program_inventory(p_id uuid,p_units jsonb,p_archive boolean default false) returns boolean
language plpgsql security definer set search_path=public as $$
declare p public.development_programs; u jsonb; seen uuid[]:='{}';v_unit uuid;
begin
 if not public.sokile_is_program_publisher() then raise exception 'La gestion des programmes neufs est réservée aux professionnels.';end if;
 select * into p from public.development_programs where id=p_id for update;
 if auth.uid() is null or not found or p.owner_id<>auth.uid() then raise exception 'Programme inaccessible.';end if;
 if jsonb_typeof(p_units)<>'array' or jsonb_array_length(p_units)>100 then raise exception 'Disponibilités invalides.';end if;
 for u in select value from jsonb_array_elements(p_units) loop
   v_unit:=(u->>'id')::uuid;
   if v_unit=any(seen) or coalesce(u->>'availability','') not in('disponible','reserve','vendu') then raise exception 'Disponibilité invalide.';end if;
   seen:=array_append(seen,v_unit);
   update public.program_units set availability=u->>'availability',updated_at=now() where id=v_unit and program_id=p_id and active;
   if not found then raise exception 'Logement inaccessible.';end if;
 end loop;
 update public.development_programs set inventory_updated_at=now(),updated_at=now(),status=case when p_archive then 'archive' else status end where id=p_id;
 return true;
end $$;
revoke all on function public.sokile_program_inventory(uuid,jsonb,boolean) from public;
grant execute on function public.sokile_program_inventory(uuid,jsonb,boolean) to authenticated;

create or replace function public.sokile_program_inquiry_done(p_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$ begin
 if not public.sokile_is_program_publisher() then raise exception 'La gestion des programmes neufs est réservée aux professionnels.';end if;
 if auth.uid() is null then raise exception 'Connectez-vous.';end if;
 update public.program_inquiries i set status='traitee' from public.development_programs p where i.id=p_id and p.id=i.program_id and p.owner_id=auth.uid();
 if not found then raise exception 'Demande inaccessible.';end if;return true;
end $$;
revoke all on function public.sokile_program_inquiry_done(uuid) from public;
grant execute on function public.sokile_program_inquiry_done(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
