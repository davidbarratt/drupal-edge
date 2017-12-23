<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

 if (isset($_SERVER['APP_DEBUG']) ? (bool) $_SERVER['APP_DEBUG'] : false) {
     // Disable OpCache
     ini_set('opcache.enable', 0);
 }

 // Set the varnish server.
 define('VHP_VARNISH_IP', 'cache');

 // If we're behind a proxy server and using HTTPS, we need to alert Wordpress of that fact
 // see also http://codex.wordpress.org/Administration_Over_SSL#Using_a_Reverse_Proxy
 if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
	 $_SERVER['HTTPS'] = 'on';
 }

if (isset($_SERVER['WP_HOME'])) {
  define('WP_HOME', $_SERVER['WP_HOME']);
}
if (isset($_SERVER['WP_SITEURL'])) {
  define('WP_SITEURL', $_SERVER['WP_SITEURL']);
}

define('WPMS_ON', true);
define('WPMS_MAILER', 'smtp');

if (isset($_SERVER['SMTP_HOST'])) {
  define('WPMS_SMTP_HOST', $_SERVER['SMTP_HOST']);
}

if (isset($_SERVER['SMTP_PORT'])) {
  define('WPMS_SMTP_PORT', $_SERVER['SMTP_PORT']);
}

if (isset($_SERVER['SMTP_ENCRYPTION'])) {
  define('WPMS_SSL', $_SERVER['SMTP_ENCRYPTION']);
}

if (!empty($_SERVER['SMTP_USERNAME']) && !empty($_SERVER['SMTP_PASSWORD'])) {
  define('WPMS_SMTP_AUTH', true);
}

if (isset($_SERVER['SMTP_USERNAME'])) {
  define('WPMS_SMTP_USER', $_SERVER['SMTP_USERNAME']);
}

if (isset($_SERVER['SMTP_PASSWORD'])) {
  define('WPMS_SMTP_PASS', $_SERVER['SMTP_PASSWORD']);
}

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', isset($_SERVER['MYSQL_DATABASE']) ? $_SERVER['MYSQL_DATABASE'] : '');

/** MySQL database username */
define('DB_USER', isset($_SERVER['MYSQL_USER']) ? $_SERVER['MYSQL_USER'] : '');

/** MySQL database password */
define('DB_PASSWORD', isset($_SERVER['MYSQL_PASSWORD']) ? $_SERVER['MYSQL_PASSWORD'] : '');

/** MySQL hostname */
define('DB_HOST', isset($_SERVER['MYSQL_HOST']) ? $_SERVER['MYSQL_HOST'] : '');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY', isset($_SERVER['AUTH_KEY']) ? $_SERVER['AUTH_KEY'] : '');
define('SECURE_AUTH_KEY', isset($_SERVER['SECURE_AUTH_KEY']) ? $_SERVER['SECURE_AUTH_KEY'] : '');
define('LOGGED_IN_KEY', isset($_SERVER['LOGGED_IN_KEY']) ? $_SERVER['LOGGED_IN_KEY'] : '');
define('NONCE_KEY', isset($_SERVER['NONCE_KEY']) ? $_SERVER['NONCE_KEY'] : '');
define('AUTH_SALT', isset($_SERVER['AUTH_SALT']) ? $_SERVER['AUTH_SALT'] : '');
define('SECURE_AUTH_SALT', isset($_SERVER['SECURE_AUTH_SALT']) ? $_SERVER['SECURE_AUTH_SALT'] : '');
define('LOGGED_IN_SALT', isset($_SERVER['LOGGED_IN_SALT']) ? $_SERVER['LOGGED_IN_SALT'] : '');
define('NONCE_SALT', isset($_SERVER['NONCE_SALT']) ? $_SERVER['NONCE_SALT'] : '');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', isset($_SERVER['APP_DEBUG']) ? (bool) $_SERVER['APP_DEBUG'] : false);


define('FORCE_SSL_ADMIN', !WP_DEBUG);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
