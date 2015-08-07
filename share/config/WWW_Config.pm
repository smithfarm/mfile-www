# ************************************************************************* 
# Copyright (c) 2014, SUSE LLC
# 
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
# 
# 1. Redistributions of source code must retain the above copyright notice,
# this list of conditions and the following disclaimer.
# 
# 2. Redistributions in binary form must reproduce the above copyright
# notice, this list of conditions and the following disclaimer in the
# documentation and/or other materials provided with the distribution.
# 
# 3. Neither the name of SUSE LLC nor the names of its contributors may be
# used to endorse or promote products derived from this software without
# specific prior written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
# ************************************************************************* 
#
# share/config/WWW_Config.pm
#
# Main configuration file
# 

# MFILE_APPNAME
#     the name of this web client, e.g. 'MFILE-www'
set( 'MFILE_APPNAME', 'mfile-www' );

# MFILE_WWW_HOST
#     default hostname where WWW server will listen
set( 'MFILE_WWW_HOST', 'localhost' );

# MFILE_WWW_PORT
#     default port number where WWW server will listen
set( 'MFILE_WWW_PORT', 5000 );

# MFILE_WWW_LOG_FILE
#     full path of logfile
set( 'MFILE_WWW_LOG_FILE', $ENV{'HOME'} . "/.mfile-www.log" );

# MFILE_WWW_LOG_FILE_RESET
#     should the logfile be deleted/wiped/unlinked/reset before each use
set( 'MFILE_WWW_LOG_FILE_RESET', 1 );

# MFILE_REST_SERVER_URI
#     determines the URI where App::MFILE::WWW will forward all AJAX calls
set( 'MFILE_REST_SERVER_URI', 'http://localhost:5000' );

# MFILE_URI_MAX_LENGTH
#     see lib/App/MFILE/WWW/Resource.pm
set( 'MFILE_URI_MAX_LENGTH', 1000 );

# MFILE_WWW_BYPASS_LOGIN_DIALOG
#     bypass the login dialog - 
#     if you set this to a true value, be sure to also set
#     MFILE_WWW_FORCE_LOGIN_CREDENTIALS
set( 'MFILE_WWW_BYPASS_LOGIN_DIALOG', 0 );

# MFILE_WWW_FORCE_LOGIN_CREDENTIALS
set( 'MFILE_WWW_FORCE_LOGIN_CREDENTIALS', {
    'nam' => 'root',
    'pwd' => 'immutable',
} );

# MFILE_WWW_LOGIN_DIALOG_CHALLENGE_TEXT
#     text displayed in the login dialog
set( 'MFILE_WWW_LOGIN_DIALOG_CHALLENGE_TEXT', 'Enter your Innerweb credentials, or demo/demo' );

# MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_USERNAME
#     see share/comp/auth.mi
set( 'MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_USERNAME', 20 );

# MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_PASSWORD
#     see share/comp/auth.mi
set( 'MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_PASSWORD', 40 );

# MFILE_WWW_SESSION_EXPIRATION_TIME
#     number of seconds after which a session will be considered stale
set( 'MFILE_WWW_SESSION_EXPIRATION_TIME', 3600 );

# MFILE_WWW_LOGOUT_MESSAGE
#     message that will be displayed for 1 second upon logout
set( 'MFILE_WWW_LOGOUT_MESSAGE', '<br><br><br><br>App::MFILE::WWW over and out.<br><br>Have a lot of fun.<br><br><br><br>' );

# JAVASCRIPT (REQUIREJS)
#     we use RequireJS to bring in dependencies - the following configuration
#     parameters are required to bring in RequireJS
set( 'MFILE_WWW_JS_REQUIREJS',         '/js/core/require.js' );
set( 'MFILE_WWW_REQUIREJS_BASEURL',    '/js/core' );

# -----------------------------------
# DO NOT EDIT ANYTHING BELOW THIS LINE
# -----------------------------------
use strict;
use warnings;

1;
