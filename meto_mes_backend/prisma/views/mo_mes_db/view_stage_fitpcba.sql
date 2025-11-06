SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  `mo_mes_db`.`mo_assemble_info` `m`
WHERE
  (cast(`m`.`start_time` AS date) = curdate())