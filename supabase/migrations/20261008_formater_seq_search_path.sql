-- P1 : formater_seq n'avait pas de search_path fige (advisory function_search_path_mutable).
ALTER FUNCTION public.formater_seq(integer) SET search_path TO 'public';
