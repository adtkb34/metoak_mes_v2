SELECT
  count(DISTINCT `a`.`camera_sn`) AS `num`,
  'FirstPass' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      sum(`m`.`error_code`) AS `error_code`
    FROM
      (
        SELECT
          `mo_mes_db`.`mo_adjust_focus`.`camera_sn` AS `camera_sn`,
          `mo_mes_db`.`mo_adjust_focus`.`error_code` AS `error_code`,
          row_number() OVER (
            PARTITION BY `mo_mes_db`.`mo_adjust_focus`.`camera_sn`
          ) AS `rownum`
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
      ) `m`
    WHERE
      (`m`.`rownum` <= 2)
    GROUP BY
      `m`.`camera_sn`
  ) `a`
WHERE
  (`a`.`error_code` = 0)
UNION
SELECT
  count(DISTINCT `m`.`camera_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  `mo_mes_db`.`mo_adjust_focus` `m`
WHERE
  (
    (`m`.`operator` <> 'AA')
    AND (cast(`m`.`start_time` AS date) = curdate())
  )
UNION
SELECT
  count(DISTINCT `a`.`camera_sn`) AS `num`,
  'DefectCount' AS `htype`
FROM
  (
    SELECT
      `m`.`camera_sn` AS `camera_sn`,
      sum(`m`.`error_code`) AS `error_code`
    FROM
      (
        SELECT
          `mo_mes_db`.`mo_adjust_focus`.`camera_sn` AS `camera_sn`,
          `mo_mes_db`.`mo_adjust_focus`.`error_code` AS `error_code`,
          row_number() OVER (
            PARTITION BY `mo_mes_db`.`mo_adjust_focus`.`camera_sn`
            ORDER BY
              `mo_mes_db`.`mo_adjust_focus`.`id` DESC
          ) AS `rownum`
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
      ) `m`
    WHERE
      (`m`.`rownum` <= 2)
    GROUP BY
      `m`.`camera_sn`
  ) `a`
WHERE
  (`a`.`error_code` <> 0)