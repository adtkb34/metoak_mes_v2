SELECT
  count(DISTINCT `n`.`camera_sn`) AS `num`,
  'FirstPass' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      `m`.`error_code` AS `error_code`
    FROM
      `mo_mes_db`.`mo_calibration` `m`
    WHERE
      (cast(`m`.`start_time` AS date) = curdate())
    GROUP BY
      `m`.`camera_sn`
  ) `n`
WHERE
  (`n`.`error_code` = 0)
UNION
SELECT
  count(DISTINCT `n`.`camera_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      `m`.`error_code` AS `error_code`
    FROM
      `mo_mes_db`.`mo_calibration` `m`
    WHERE
      (cast(`m`.`start_time` AS date) = curdate())
    GROUP BY
      `m`.`camera_sn`
  ) `n`
UNION
SELECT
  count(DISTINCT `a`.`camera_sn`) AS `num`,
  'DefectCount' AS `htype`
FROM
  (
    SELECT
      `n`.`camera_sn` AS `camera_sn`,
      `n`.`error_code` AS `error_code`
    FROM
      (
        SELECT
          `mo_mes_db`.`mo_calibration`.`camera_sn` AS `camera_sn`,
          `mo_mes_db`.`mo_calibration`.`error_code` AS `error_code`,
          row_number() OVER (
            PARTITION BY `mo_mes_db`.`mo_calibration`.`camera_sn`
            ORDER BY
              `mo_mes_db`.`mo_calibration`.`id` DESC
          ) AS `rownum`
        FROM
          `mo_mes_db`.`mo_calibration`
        WHERE
          (
            cast(
              `mo_mes_db`.`mo_calibration`.`start_time` AS date
            ) = curdate()
          )
      ) `n`
    GROUP BY
      `n`.`camera_sn`
    HAVING
      (`n`.`error_code` <> 0)
  ) `a`