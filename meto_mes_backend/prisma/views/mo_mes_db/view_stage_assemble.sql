SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  `mo_mes_db`.`mo_tag_shell_info` `m`
WHERE
  (cast(`m`.`operation_time` AS date) = curdate())