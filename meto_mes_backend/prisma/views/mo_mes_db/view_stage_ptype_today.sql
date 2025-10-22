SELECT
  count(`b`.`beam_sn`) AS `num`,
  `p`.`product_type` AS `product_type`,
  'adjust' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`camera_sn` AS `beam_sn`
      FROM
        `mo_mes_db`.`mo_adjust_focus` `m`
      WHERE
        (cast(`m`.`start_time` AS date) = curdate())
    ) `b`
    LEFT JOIN (
      SELECT
        `m`.`beam_sn` AS `beam_sn`,
        `n`.`product_type` AS `product_type`
      FROM
        (
          `mo_mes_db`.`mo_beam_info` `m`
          JOIN `mo_mes_db`.`mo_produce_order` `n`
        )
      WHERE
        (`m`.`produce_order_id` = `n`.`id`)
    ) `p` ON((`b`.`beam_sn` = `p`.`beam_sn`))
  )
GROUP BY
  `p`.`product_type`
UNION
ALL
SELECT
  count(`a`.`beam_sn`) AS `num`,
  `p`.`product_type` AS `product_type`,
  'AA' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`beam_sn` AS `beam_sn`
      FROM
        `mo_mes_db`.`mo_auto_adjust_info` `m`
      WHERE
        (
          (`m`.`station_num` = 7)
          AND (cast(`m`.`add_time` AS date) = curdate())
        )
    ) `a`
    LEFT JOIN (
      SELECT
        `m`.`beam_sn` AS `beam_sn`,
        `n`.`product_type` AS `product_type`
      FROM
        (
          `mo_mes_db`.`mo_beam_info` `m`
          JOIN `mo_mes_db`.`mo_produce_order` `n`
        )
      WHERE
        (`m`.`produce_order_id` = `n`.`id`)
    ) `p` ON((`a`.`beam_sn` = `p`.`beam_sn`))
  )
GROUP BY
  `p`.`product_type`
UNION
ALL
SELECT
  count(`a`.`beam_sn`) AS `num`,
  `p`.`product_type` AS `product_type`,
  'fitpcba' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`camera_sn` AS `beam_sn`
      FROM
        `mo_mes_db`.`mo_assemble_info` `m`
      WHERE
        (cast(`m`.`start_time` AS date) = curdate())
    ) `a`
    LEFT JOIN (
      SELECT
        `m`.`beam_sn` AS `beam_sn`,
        `n`.`product_type` AS `product_type`
      FROM
        (
          `mo_mes_db`.`mo_beam_info` `m`
          JOIN `mo_mes_db`.`mo_produce_order` `n`
        )
      WHERE
        (`m`.`produce_order_id` = `n`.`id`)
    ) `p` ON((`a`.`beam_sn` = `p`.`beam_sn`))
  )
GROUP BY
  `p`.`product_type`
UNION
ALL
SELECT
  count(`a`.`beam_sn`) AS `num`,
  `p`.`product_type` AS `product_type`,
  'assemble' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`camera_sn` AS `beam_sn`
      FROM
        `mo_mes_db`.`mo_tag_shell_info` `m`
      WHERE
        (cast(`m`.`operation_time` AS date) = curdate())
    ) `a`
    LEFT JOIN (
      SELECT
        `m`.`beam_sn` AS `beam_sn`,
        `n`.`product_type` AS `product_type`
      FROM
        (
          `mo_mes_db`.`mo_beam_info` `m`
          JOIN `mo_mes_db`.`mo_produce_order` `n`
        )
      WHERE
        (`m`.`produce_order_id` = `n`.`id`)
    ) `p` ON((`a`.`beam_sn` = `p`.`beam_sn`))
  )
GROUP BY
  `p`.`product_type`
UNION
ALL
SELECT
  count(`a`.`shell_sn`) AS `num`,
  `mo_mes_db`.`b`.`product_type` AS `product_type`,
  'calibrate' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `mo_mes_db`.`mo_calibration`.`camera_sn` AS `shell_sn`
      FROM
        `mo_mes_db`.`mo_calibration`
      WHERE
        (
          cast(
            `mo_mes_db`.`mo_calibration`.`start_time` AS date
          ) = curdate()
        )
    ) `a`
    LEFT JOIN `mo_mes_db`.`view_shell_beam_type` `b` ON((`a`.`shell_sn` = `mo_mes_db`.`b`.`shell_sn`))
  )
GROUP BY
  `mo_mes_db`.`b`.`product_type`
UNION
ALL
SELECT
  count(`a`.`camera_sn`) AS `num`,
  `mo_mes_db`.`b`.`product_type` AS `product_type`,
  'FQC' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`camera_sn` AS `camera_sn`
      FROM
        `mo_mes_db`.`mo_final_result` `m`
      WHERE
        (
          (`m`.`check_type` = 'FQC')
          AND (cast(`m`.`check_time` AS date) = curdate())
        )
    ) `a`
    LEFT JOIN `mo_mes_db`.`view_shell_beam_type` `b` ON((`mo_mes_db`.`b`.`shell_sn` = `a`.`camera_sn`))
  )
GROUP BY
  `mo_mes_db`.`b`.`product_type`
UNION
ALL
SELECT
  count(`a`.`camera_sn`) AS `num`,
  `mo_mes_db`.`b`.`product_type` AS `product_type`,
  'OQC' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `m`.`camera_sn` AS `camera_sn`
      FROM
        `mo_mes_db`.`mo_final_result` `m`
      WHERE
        (
          (`m`.`check_type` = 'OQC')
          AND (cast(`m`.`check_time` AS date) = curdate())
        )
    ) `a`
    LEFT JOIN `mo_mes_db`.`view_shell_beam_type` `b` ON((`a`.`camera_sn` = `mo_mes_db`.`b`.`shell_sn`))
  )
GROUP BY
  `mo_mes_db`.`b`.`product_type`
UNION
ALL
SELECT
  count(`a`.`packing_code`) AS `num`,
  `mo_mes_db`.`b`.`product_type` AS `product_type`,
  'pack1' AS `stage`
FROM
  (
    (
      SELECT
        `mo_mes_db`.`mo_packing_info`.`packing_code` AS `packing_code`,
        `mo_mes_db`.`mo_packing_info`.`camera_sn` AS `shell_sn`
      FROM
        `mo_mes_db`.`mo_packing_info`
      WHERE
        (
          cast(
            `mo_mes_db`.`mo_packing_info`.`start_time` AS date
          ) = curdate()
        )
      GROUP BY
        `mo_mes_db`.`mo_packing_info`.`packing_code`
    ) `a`
    LEFT JOIN `mo_mes_db`.`view_shell_beam_type` `b` ON((`a`.`shell_sn` = `mo_mes_db`.`b`.`shell_sn`))
  )
GROUP BY
  `mo_mes_db`.`b`.`product_type`
UNION
ALL
SELECT
  count(`a`.`shell_sn`) AS `num`,
  `mo_mes_db`.`b`.`product_type` AS `product_type`,
  'pack2' AS `stage`
FROM
  (
    (
      SELECT
        DISTINCT `mo_mes_db`.`mo_packing_info`.`camera_sn` AS `shell_sn`
      FROM
        `mo_mes_db`.`mo_packing_info`
      WHERE
        (
          cast(
            `mo_mes_db`.`mo_packing_info`.`start_time` AS date
          ) = curdate()
        )
    ) `a`
    LEFT JOIN `mo_mes_db`.`view_shell_beam_type` `b` ON((`a`.`shell_sn` = `mo_mes_db`.`b`.`shell_sn`))
  )
GROUP BY
  `mo_mes_db`.`b`.`product_type`