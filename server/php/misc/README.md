# Miscellaneous
Unnecessary but useful pieces of code

## at

A Linux style crontab hack where it relies on an external script to ping it so it
can execute a certain command at a certain time

### cron example using wget or curl
```
# m h dom mon dow user  command
*/20 * * * *  root  /usr/bin/wget -q --post-data -O /dev/null http://xibbit.github.io/at.php > /dev/null 2>&1
*/20 * * * *  /usr/bin/curl http://xibbit.github.io/at.php > /dev/null 2>&1
```

## backup

A backup hack with several clever features and a few flaws.  Not ready for production.  Only provided for ideas and future development.

### cron example to backup every 30 minutes
```
# m h dom mon dow user  command
*/30 * * * *  /home/sysadmin/PublicFigureBackups/auto_backup >/dev/null 2>&1
```

### auto_backup shell script
```
#!/bin/sh
TMPFILE=$(mktemp /tmp/backup_php.XXXXXX)
/usr/bin/curl http://xibbit.github.io/backup.php > $TMPFILE
IV=$(/usr/bin/cut -b 14-45 < $TMPFILE)
/bin/cat < $TMPFILE | /usr/bin/cut -b 47- | /usr/bin/base64 -d | /usr/bin/openssl aes-256-cbc -d -nosalt -K 0000000000000000000000000000000000000000000000000000000000000000 -iv $IV -out /home/sysadmin/PublicFigureBackups/backup_pf_`date '+%Y%m%d_%H%M%S'`.php
/bin/rm $TMPFILE
```

## crypt

Encrypts and decrypts data and can use the convenient modified version of /etc/shadow
format.

## install

Creates tables and inserts initial table data into a database.

It never overwrites an existing table or existing table data so it is harmless.

