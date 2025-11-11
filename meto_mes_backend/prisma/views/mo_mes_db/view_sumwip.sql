SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`
FROM
  (
    SELECT
      DISTINCT `mo_mes_db`.`mo_adjust_focus`.`camera_sn` AS `camera_sn`
    FROM
      `mo_mes_db`.`mo_adjust_focus`
    WHERE
      (
        cast(
          `mo_mes_db`.`mo_adjust_focus`.`start_time` AS date
        ) = curdate()
      )
    UNION
    SELECT
      DISTINCT `mo_mes_db`.`mo_calibration`.`camera_sn` AS `camera_sn`
    FROM
      `mo_mes_db`.`mo_calibration`
    WHERE
      (
        cast(
          `mo_mes_db`.`mo_calibration`.`start_time` AS date
        ) = curdate()
      )
  ) `m`
WHERE
  `m`.`camera_sn` IN (
    SELECT
      DISTINCT `mo_mes_db`.`mo_final_result`.`camera_sn`
    FROM
      `mo_mes_db`.`mo_final_result`
    WHERE
      (
        cast(
          `mo_mes_db`.`mo_final_result`.`check_time` AS date
        ) = curdate()
      )
  ) IS false