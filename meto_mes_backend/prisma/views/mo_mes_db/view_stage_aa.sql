SELECT
  count(DISTINCT `a`.`beam_sn`) AS `num`,
  'FirstPass' AS `htype`
FROM
  (
    SELECT
      `m`.`beam_sn` AS `beam_sn`,
      `m`.`operation_result` AS `operation_result`
    FROM
      `mo_mes_db`.`mo_auto_adjust_info` `m`
    WHERE
      (
        (`m`.`station_num` = 7)
        AND (cast(`m`.`operation_time` AS date) >= curdate())
      )
    GROUP BY
      `m`.`beam_sn`
  ) `a`
WHERE
  (`a`.`operation_result` = 1)
UNION
SELECT
  count(DISTINCT `m`.`beam_sn`) AS `num`,
  'SumCount' AS `htype`
FROM
  `mo_mes_db`.`mo_auto_adjust_info` `m`
WHERE
  (
    (`m`.`station_num` = 7)
    AND (cast(`m`.`operation_time` AS date) >= curdate())
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
          `mo_mes_db`.`mo_auto_adjust_info`.`beam_sn` AS `camera_sn`,
          `mo_mes_db`.`mo_auto_adjust_info`.`operation_result` AS `error_code`,
          row_number() OVER (
            PARTITION BY `mo_mes_db`.`mo_auto_adjust_info`.`beam_sn`
            ORDER BY
              `mo_mes_db`.`mo_auto_adjust_info`.`id` DESC
          ) AS `rownum`
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
      ) `m`
    GROUP BY
      `m`.`camera_sn`
  ) `a`
WHERE
  (`a`.`error_code` = 0)