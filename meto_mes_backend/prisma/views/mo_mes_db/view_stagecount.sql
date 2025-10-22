SELECT
  date_format(
    `mo_mes_db`.`mo_calibration`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
  count(
    DISTINCT `mo_mes_db`.`mo_calibration`.`camera_sn`
  ) AS `num`,
  'calibration' AS `stage`
FROM
  `mo_mes_db`.`mo_calibration`
WHERE
  (
    `mo_mes_db`.`mo_calibration`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
    AND NOW()
  )
GROUP BY
  `days`
UNION
ALL
SELECT
  date_format(
    `mo_mes_db`.`mo_assemble_info`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
  count(
    DISTINCT `mo_mes_db`.`mo_assemble_info`.`camera_sn`
  ) AS `num`,
  'assemble' AS `stage`
FROM
  `mo_mes_db`.`mo_assemble_info`
WHERE
  (
    `mo_mes_db`.`mo_assemble_info`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
    AND NOW()
  )
GROUP BY
  `days`
UNION
ALL
SELECT
  date_format(
    `mo_mes_db`.`mo_final_check`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
  count(
    DISTINCT `mo_mes_db`.`mo_final_check`.`camera_sn`
  ) AS `num`,
  'finalcheck' AS `stage`
FROM
  `mo_mes_db`.`mo_final_check`
WHERE
  (
    `mo_mes_db`.`mo_final_check`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
    AND NOW()
  )
GROUP BY
  `days`
UNION
ALL
SELECT
  date_format(
    `mo_mes_db`.`mo_adjust_focus`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
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
      `mo_mes_db`.`mo_adjust_focus`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
      AND NOW()
    )
  )
GROUP BY
  `days`
UNION
ALL
SELECT
  date_format(
    `mo_mes_db`.`mo_adjust_focus`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
  count(
    DISTINCT `mo_mes_db`.`mo_adjust_focus`.`camera_sn`
  ) AS `num`,
  'aa' AS `stage`
FROM
  `mo_mes_db`.`mo_adjust_focus`
WHERE
  (
    (`mo_mes_db`.`mo_adjust_focus`.`operator` = 'AA')
    AND (
      `mo_mes_db`.`mo_adjust_focus`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
      AND NOW()
    )
  )
GROUP BY
  `days`
UNION
ALL
SELECT
  date_format(
    `mo_mes_db`.`mo_oqc_info`.`start_time`,
    '%Y-%m-%d'
  ) AS `days`,
  count(DISTINCT `mo_mes_db`.`mo_oqc_info`.`camera_sn`) AS `num`,
  'oqc' AS `stage`
FROM
  `mo_mes_db`.`mo_oqc_info`
WHERE
  (
    `mo_mes_db`.`mo_oqc_info`.`start_time` BETWEEN (NOW() - INTERVAL 30 DAY)
    AND NOW()
  )
GROUP BY
  `days`