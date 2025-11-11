SELECT
  `mo_mes_db`.`mo_stereo_precheck`.`id` AS `id`,
  `mo_mes_db`.`mo_stereo_precheck`.`datetime` AS `datetime`,
  `mo_mes_db`.`mo_stereo_precheck`.`sn` AS `sn`,
  `mo_mes_db`.`mo_stereo_precheck`.`error_code` AS `error_code`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_dirty_detect_enabled` AS `is_dirty_detect_enabled`,
  `mo_mes_db`.`mo_stereo_precheck`.`dirty_count_left` AS `dirty_count_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`dirty_count_right` AS `dirty_count_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`dirty_standard_cof` AS `dirty_standard_cof`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_clarity_detect_enabled` AS `is_clarity_detect_enabled`,
  `mo_mes_db`.`mo_stereo_precheck`.`clarity_left` AS `clarity_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`clarity_right` AS `clarity_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`clarity_standard_val` AS `clarity_standard_val`,
  `mo_mes_db`.`mo_stereo_precheck`.`clarity_standard_mdiff` AS `clarity_standard_mdiff`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_lo_detect_enabled` AS `is_lo_detect_enabled`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_medium` AS `lo_medium`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_mean` AS `lo_mean`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_max` AS `lo_max`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_min` AS `lo_min`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_stddev` AS `lo_stddev`,
  `mo_mes_db`.`mo_stereo_precheck`.`lo_standard_val` AS `lo_standard_val`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_medium` AS `x_offset_medium`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_mean` AS `x_offset_mean`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_max` AS `x_offset_max`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_min` AS `x_offset_min`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_stddev` AS `x_offset_stddev`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_standard_val` AS `x_offset_standard_val`,
  `mo_mes_db`.`mo_stereo_precheck`.`x_offset_standard_tolerance` AS `x_offset_standard_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_color_cast_detect_enabled` AS `is_color_cast_detect_enabled`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_r_mean_left` AS `color_cast_r_mean_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_g_mean_left` AS `color_cast_g_mean_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_b_mean_left` AS `color_cast_b_mean_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_r_mean_right` AS `color_cast_r_mean_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_g_mean_right` AS `color_cast_g_mean_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_b_mean_right` AS `color_cast_b_mean_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_r_stddev_left` AS `color_cast_r_stddev_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_g_stddev_left` AS `color_cast_g_stddev_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_b_stddev_left` AS `color_cast_b_stddev_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_r_stddev_right` AS `color_cast_r_stddev_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_g_stddev_right` AS `color_cast_g_stddev_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_b_stddev_right` AS `color_cast_b_stddev_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_r_center` AS `color_cast_standard_r_center`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_r_tolerance` AS `color_cast_standard_r_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_g_center` AS `color_cast_standard_g_center`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_g_tolerance` AS `color_cast_standard_g_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_b_center` AS `color_cast_standard_b_center`,
  `mo_mes_db`.`mo_stereo_precheck`.`color_cast_standard_b_tolerance` AS `color_cast_standard_b_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_cod_detect_enabled` AS `is_cod_detect_enabled`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_x_left` AS `cod_x_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_y_left` AS `cod_y_left`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_x_right` AS `cod_x_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_y_right` AS `cod_y_right`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_standard_x_center` AS `cod_standard_x_center`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_standard_x_tolerance` AS `cod_standard_x_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_standard_y_center` AS `cod_standard_y_center`,
  `mo_mes_db`.`mo_stereo_precheck`.`cod_standard_y_tolerance` AS `cod_standard_y_tolerance`,
  `mo_mes_db`.`mo_stereo_precheck`.`is_imu_valid` AS `is_imu_valid`
FROM
  `mo_mes_db`.`mo_stereo_precheck`
WHERE
  (
    (
      `mo_mes_db`.`mo_stereo_precheck`.`is_clarity_detect_enabled` = TRUE
    )
    AND (
      `mo_mes_db`.`mo_stereo_precheck`.`is_lo_detect_enabled` = TRUE
    )
    AND (
      `mo_mes_db`.`mo_stereo_precheck`.`is_dirty_detect_enabled` = TRUE
    )
    AND (
      `mo_mes_db`.`mo_stereo_precheck`.`is_color_cast_detect_enabled` = TRUE
    )
    AND (
      `mo_mes_db`.`mo_stereo_precheck`.`is_cod_detect_enabled` = TRUE
    )
  )