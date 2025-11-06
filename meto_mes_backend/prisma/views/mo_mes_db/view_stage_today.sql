SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_adjust_focus`.`camera_sn`
  ) AS `num`,
  'adjust' AS `stage`
FROM
  `mo_mes_db`.`mo_adjust_focus`
WHERE
  (
    (`mo_mes_db`.`mo_adjust_focus`.`operator` <> 'AA')
    AND (
      cast(
        `mo_mes_db`.`mo_adjust_focus`.`start_time` AS date
      ) = curdate()
    )
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_auto_adjust_info`.`beam_sn`
  ) AS `num`,
  'aa' AS `stage`
FROM
  `mo_mes_db`.`mo_auto_adjust_info`
WHERE
  (
    (
      `mo_mes_db`.`mo_auto_adjust_info`.`station_num` = 7
    )
    AND (
      cast(
        `mo_mes_db`.`mo_auto_adjust_info`.`operation_time` AS date
      ) = curdate()
    )
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_assemble_info`.`camera_sn`
  ) AS `num`,
  'fitpcba' AS `stage`
FROM
  `mo_mes_db`.`mo_assemble_info`
WHERE
  (
    cast(
      `mo_mes_db`.`mo_assemble_info`.`start_time` AS date
    ) = curdate()
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_tag_shell_info`.`camera_sn`
  ) AS `num`,
  'assemble' AS `stage`
FROM
  `mo_mes_db`.`mo_tag_shell_info`
WHERE
  (
    cast(
      `mo_mes_db`.`mo_tag_shell_info`.`operation_time` AS date
    ) = curdate()
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_calibration`.`camera_sn`
  ) AS `num`,
  'calibration' AS `stage`
FROM
  `mo_mes_db`.`mo_calibration`
WHERE
  (
    cast(
      `mo_mes_db`.`mo_calibration`.`start_time` AS date
    ) = curdate()
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_final_result`.`camera_sn`
  ) AS `num`,
  'finalcheck' AS `stage`
FROM
  `mo_mes_db`.`mo_final_result`
WHERE
  (
    (
      `mo_mes_db`.`mo_final_result`.`check_type` = 'FQC'
    )
    AND (
      cast(
        `mo_mes_db`.`mo_final_result`.`check_time` AS date
      ) = curdate()
    )
  )
UNION
ALL
SELECT
  count(
    DISTINCT `mo_mes_db`.`mo_final_result`.`camera_sn`
  ) AS `num`,
  'oqc' AS `stage`
FROM
  `mo_mes_db`.`mo_final_result`
WHERE
  (
    (
      `mo_mes_db`.`mo_final_result`.`check_type` = 'OQC'
    )
    AND (
      cast(
        `mo_mes_db`.`mo_final_result`.`check_time` AS date
      ) = curdate()
    )
  )
UNION
ALL
SELECT
  count(DISTINCT `m`.`packing_code`) AS `num`,
  'pack1' AS `stage`
FROM
  `mo_mes_db`.`mo_packing_info` `m`
WHERE
  (cast(`m`.`start_time` AS date) = curdate())
UNION
ALL
SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`,
  'pack2' AS `stage`
FROM
  `mo_mes_db`.`mo_packing_info` `m`
WHERE
  (cast(`m`.`start_time` AS date) = curdate())