SELECT
  count(DISTINCT `a`.`camera_sn`) AS `num`,
  'FirstPass' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      `m`.`check_result` AS `check_result`
    FROM
      `mo_mes_db`.`mo_final_result` `m`
    WHERE
      (
        (`m`.`check_type` = 'FQC')
        AND (cast(`m`.`check_time` AS date) = curdate())
      )
    GROUP BY
      `m`.`camera_sn`
  ) `a`
WHERE
  (`a`.`check_result` = 1)
UNION
SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  `mo_mes_db`.`mo_final_result` `m`
WHERE
  (
    (`m`.`check_type` = 'FQC')
    AND (cast(`m`.`check_time` AS date) = curdate())
  )
UNION
SELECT
  count(DISTINCT `a`.`camera_sn`) AS `num`,
  'DefectCount' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      `m`.`error_code` AS `error_code`
    FROM
      (
        SELECT
          `mo_mes_db`.`mo_final_result`.`camera_sn` AS `camera_sn`,
          `mo_mes_db`.`mo_final_result`.`check_result` AS `error_code`,
          row_number() OVER (
            PARTITION BY `mo_mes_db`.`mo_final_result`.`camera_sn`
            ORDER BY
              `mo_mes_db`.`mo_final_result`.`id` DESC
          ) AS `rownum`
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
      ) `m`
    GROUP BY
      `m`.`camera_sn`
  ) `a`
WHERE
  (`a`.`error_code` = 0)