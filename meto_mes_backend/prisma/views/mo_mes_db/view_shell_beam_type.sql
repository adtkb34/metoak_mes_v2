SELECT
  `a`.`shell_sn` AS `shell_sn`,
  `a`.`beam_sn` AS `beam_sn`,
  `a`.`order_id` AS `order_id`,
  `a`.`order_code` AS `order_code`,
  `a`.`product_type` AS `product_type`,
  `a`.`rownum` AS `rownum`
FROM
  (
    SELECT
      `m`.`shell_sn` AS `shell_sn`,
      `n`.`beam_sn` AS `beam_sn`,
      `o`.`id` AS `order_id`,
      `o`.`work_order_code` AS `order_code`,
      `o`.`product_type` AS `product_type`,
      row_number() OVER (
        PARTITION BY `m`.`shell_sn`
        ORDER BY
          `m`.`id` DESC
      ) AS `rownum`
    FROM
      (
        (
          `mo_mes_db`.`mo_tag_shell_info` `m`
          JOIN `mo_mes_db`.`mo_beam_info` `n`
        )
        JOIN `mo_mes_db`.`mo_produce_order` `o`
      )
    WHERE
      (
        (`m`.`camera_sn` = `n`.`beam_sn`)
        AND (`n`.`produce_order_id` = `o`.`id`)
      )
  ) `a`
GROUP BY
  `a`.`shell_sn`