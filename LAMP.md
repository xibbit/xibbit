# LAMP installation difficulties?

LAMP stands for Linux, Apache, MySQL and PHP.  Read more about it here: [LAMP stack](https://en.wikipedia.org/wiki/LAMP_(software_bundle)).

I prefer all-in-one LAMP installers, such as MAMP, AMPPS or `sudo apt-get install lamp-server^`, which almost never go wrong but you can install the LAMP components separately.

In either case, a not-entirely-working LAMP installation can always be fixed and it helps to know the flow.  Usually, they are installed in the following order.

**Linux** This doesn't matter.  LAMP works on Windows and Mac as well as Linux and is just as good.  As long as your computer starts, you finished this step.

**Apache** This is an ordinary application installation.  If you can access http://localhost or http://localhost:8080 using a browser, you finished this step.  If you get a "could not connect", troubleshoot Apache and ignore Linux, MySQL and PHP for now.

**MySQL** This is an ordinary application installation, too.  As long as you can connect using `mysql -u root -p` with password "mysql", you finished this step.  If you get a "could not connect", permissions or other MySQL errors, troubleshoot MySQL and ignore Linux, Apache and PHP for now.

On Linux, you may need to do this:

```console
$ sudo mysql -u root
mysql> set global validate_password.length = 0;
mysql> set global validate_password.number_count = 0;
mysql> set global validate_password.special_char_count = 0;
mysql> set global validate_password.mixed_case_count = 0;
mysql> show variables like 'validate_password%';
+--------------------------------------+--------+
| Variable_name                        | Value  |
+--------------------------------------+--------+
| validate_password.check_user_name    | ON     |
| validate_password.dictionary_file    |        |
| validate_password.length             | 4      |
| validate_password.mixed_case_count   | 0      |
| validate_password.number_count       | 0      |
| validate_password.policy             | HIGH   |
| validate_password.special_char_count | 0      |
+--------------------------------------+--------+
mysql> use mysql;
mysql> alter user 'root'@'localhost' identified with caching_sha2_password by 'mysql';
mysql> quit
$ mysql -u root -p
Password: mysql
mysql> quit
```

**PHP** This is both an ordinary application but also an Apache plugin module.  LAMP uses the plugin module (and ignores the application).  Apache must be working before you can finish this step.  Under the covers, PHP plugin module to Apache is a shared library (.so file on Mac or Linux) or DLL (.dll file on Windows).  If you go http://localhost/xibbit/server/php/misc/install.php in a browser, like Chrome, and you are seeing the PHP code instead of Apache executing the PHP code, PHP is not installed or configured properly.  The install.php should indicate this situation.  To fix, you may need to reinstall PHP or "enable" PHP using commands or a procedure, like editing a .conf or .ini file, and restarting Apache.

**php-mysqli** This is the trickiest step and the easiest to go wrong.  PHP is an Apache plugin module but it also has its own plugins.  php-mysqli is a "plugin inside the PHP plugin module of Apache".  PHP must be working first before php-mysqli can work.  It connects PHP to MySQL: it adds all the mysqli_XXX() functions to PHP. This allows PHP to "reach" the MySQL server.  Under the covers, php-mysqli is a shared library (.so file on Mac or Linux) or DLL (.dll file on Windows).  If you go http://localhost/xibbit/server/php/misc/install.php in a browser, the install.php should indicate if php-mysqli is working (only yellow or white text background) or not working (mostly red text background).  To fix on Mac or Linux, you may need to install it using a command like `sudo apt-get install php-mysqli` or `sudo apt-get install php8.x-mysqli` or "enable" it with `sudo phpenmod mysqli`.  You may need to reinstall it or edit a .conf or .ini file (e.g. php.ini).  Once it shows white or yellow text background and no red, php-mysqli is working.

Once you get one of these steps working, you shouldn't need to revisit it.  Nowadays, almost any version of Apache can be made to work with any version of PHP which can be made to work with any version of MySQL.  A lot of this stuff has been standardized for a decade or more.