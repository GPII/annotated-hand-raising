# Annotated Hand Raising

## Installation instructions:

### On CentOS 7

Download the code and exec these commands with superuser privileges:

1. yum install -y epel-release
2. yum install -y nodejs couchdb
3. systemctl enable couchdb
4. systemctl start couchdb

As a non-privileged user, exec these commands:

1. npm install
2. npm app.js

The application listen by the port 3000, so you can access to it using the url:

 http://localhost:3000

