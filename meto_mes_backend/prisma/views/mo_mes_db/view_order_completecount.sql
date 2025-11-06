SELECT
  `n`.`work_order_code` AS `work_order_code`,
  count(DISTINCT `m`.`camera_sn`) AS `complete_num`
FROM
  (
    `mo_mes_db`.`mo_final_result` `m`
    JOIN `mo_mes_db`.`mo_tag_info` `n`
  )
WHERE
  (
    (`m`.`camera_sn` = `n`.`tag_sn`)
    AND (`m`.`check_type` = 'FQC')
    AND (`m`.`check_result` = TRUE)
  )
GROUP BY
  `n`.`work_order_code`