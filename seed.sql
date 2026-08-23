insert into public.mbg_days(service_date,title,energy_kcal,benefits,published)
values
('2026-08-21','Menu MBG',1816,'Protein membantu pertumbuhan dan pemeliharaan jaringan. Karbohidrat menjadi sumber energi. Vitamin, mineral, dan serat mendukung fungsi tubuh.',true),
('2026-08-20','Menu MBG',2592,'Protein berperan dalam pertumbuhan dan pemeliharaan jaringan. Karbohidrat menyediakan energi, sedangkan vitamin, mineral, dan serat membantu mendukung fungsi tubuh.',true)
on conflict(service_date) do nothing;

insert into public.mbg_items(day_id,name,icon,description,sort_order)
select id,'Nasi putih','🍚','Sumber karbohidrat',0 from public.mbg_days where service_date='2026-08-21'
union all select id,'Ayam Popcorn','🍗','Sumber protein',1 from public.mbg_days where service_date='2026-08-21'
union all select id,'Sayuran','🥗','Sumber vitamin & mineral',2 from public.mbg_days where service_date='2026-08-21'
union all select id,'Buah','🍊','Sumber vitamin, mineral & serat',3 from public.mbg_days where service_date='2026-08-21'
union all select id,'Nasi putih','🍚','Sumber karbohidrat',0 from public.mbg_days where service_date='2026-08-20'
union all select id,'Ayam cabe merah','🌶️','Sumber protein',1 from public.mbg_days where service_date='2026-08-20'
union all select id,'Tempe krispi','🥢','Sumber protein nabati',2 from public.mbg_days where service_date='2026-08-20'
union all select id,'Buah','🍉','Sumber vitamin, mineral & serat',3 from public.mbg_days where service_date='2026-08-20';
