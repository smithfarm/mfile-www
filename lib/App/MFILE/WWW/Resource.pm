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

# ------------------------
# This package defines how our web server handles the request-response 
# cycle. All the "heavy lifting" is done by Web::Machine and Plack.
# ------------------------

package App::MFILE::WWW::Resource;

use strict;
use warnings;

use App::CELL qw( $CELL $log $meta $site );
use App::MFILE::HTTP qw( rest_req );
use Data::Dumper;
use Encode qw( decode_utf8 );
use JSON;
use LWP::UserAgent;
use Params::Validate qw(:all);
use Plack::Session;
use Try::Tiny;

# methods/attributes not defined in this module will be inherited from:
use parent 'Web::Machine::Resource';



=head1 NAME

App::MFILE::WWW::Resource - HTTP request/response cycle




=head1 VERSION

Version 0.136

=cut

our $VERSION = '0.136';




=head1 SYNOPSIS

In PSGI file:

    use Web::Machine;

    Web::Machine->new(
        resource => 'App::MFILE::WWW::Resource',
    )->to_app;




=head1 DESCRIPTION

This is where we override the default versions of various methods defined by
L<Web::Machine::Resource>.

=cut




=head1 METHODS


=head2 context

This method is where we store data that needs to be shared among
routines in this module.

=cut

sub context {
    my $self = shift;
    $self->{'context'};
}


=head2 service_available

This is the first method called on every incoming request.

=cut

sub service_available {
    my $self = shift;
    $log->info( "Incoming " . $self->request->method . " request for " . $self->request->path_info );
    $self->{'context'} = {};
    return 1;
}


=head2 content_types_provided

For GET requests, this is where we add our HTML body to the HTTP response.

=cut
 
sub content_types_provided { 
    [ { 'text/html' => '_render_response_html' }, ] 
}

sub _render_response_html { 
    my ( $self ) = @_;
    my $r = $self->request;
    my $session = Plack::Session->new( $r->{'env'} );
    my $ce = $session->get('currentEmployee');
    my $cepriv;
    if ( $ce ) {
        $cepriv = $ce->{'priv'} || '';
        #delete $ce->{'priv'};
        delete $ce->{'schedule'};
    }
    my $entity;
    $entity = ( $r->path_info =~ m/test/i )
        ? test_html( $ce, $cepriv )
        : main_html( $ce, $cepriv );
    return $entity;
}



=head2 charsets_provided

This method causes L<Web::Machine> to encode the response body in UTF-8. 

=cut

sub charsets_provided { 
    [ 'utf-8' ]; 
}



=head2 default_charset

Really use UTF-8 all the time.

=cut

sub default_charset { 
    'utf-8'; 
}



=head2 allowed_methods

Determines which HTTP methods we recognize.

=cut

sub allowed_methods {
    [ 'GET', 'POST', ]; 
}



=head2 uri_too_long

Is the URI too long?

=cut

sub uri_too_long {
    my ( $self, $uri ) = @_;

    ( length $uri > $site->MFILE_URI_MAX_LENGTH )
        ? 1
        : 0;
}



=head2 is_authorized

Since all requests go through this function at a fairly early stage, we 
leverage it to validate the session. 

=cut

sub is_authorized {
    my ( $self ) = @_;

    $log->debug( "Entering is_authorized" );

    my $r = $self->request;
    my $session = Plack::Session->new( $r->{'env'} );
    my $remote_addr = $$r{'env'}{'REMOTE_ADDR'};
    my $ce;

    # UNCOMMENT TO DEBUG
    #$log->debug( "currentEmployee is " . Dumper $session->get('currentEmployee') );
    #$log->debug( "remote IP address is " . Dumper $session->get('ip_addr') );
    #$log->debug( "remote IP address is supposed to be $remote_addr" );
    #my $yesno = _is_fresh( $session );
    #$log->debug( "the session is " . ( $yesno ? '' : 'not ' ) . "fresh" );

    #
    # we are not to connect to REST server, so authorization is meaningless
    #
    if ( $meta->META_WWW_CONNECT_TO_REST_SERVER eq 'false' ) {
        $log->debug( 'is_authorized: we are not to connect to REST server, so authorization is meaningless' );
        $session->set('last_seen', time); 
        return 1;
    }

    #
    # authorized session
    #
    if ( $ce = $session->get('currentEmployee') and
         $session->get('ip_addr') and 
         $session->get('ip_addr') eq $remote_addr and
         _is_fresh( $session ) )
    {
        $log->debug( "is_authorized: Authorized session " . $session->id . " (" . $ce->{'nick'} . ")" );
        $session->set('last_seen', time); 
        return 1;
    }

    #
    # login attempt
    #
    if ( $r->method eq 'POST' and 
         $self->context->{'request_body'} and 
         $self->context->{'request_body'}->{'method'} and
         $self->context->{'request_body'}->{'method'} =~ m/^LOGIN/i ) {
        $log->debug( "is_authorized: Login attempt - pass it on" );
        return 1;
    }

    #
    # check the MFILE_WWW_BYPASS_LOGIN_DIALOG site param - if true,
    # bypass the login dialog by force-feeding it credentials from the
    # site configuration
    # 
    $meta->set('META_LOGIN_BYPASS_STATE', 0) if not defined $meta->META_LOGIN_BYPASS_STATE;
    if ( $site->MFILE_WWW_BYPASS_LOGIN_DIALOG and 
         not $meta->META_LOGIN_BYPASS_STATE ) {
        $log->notice("Bypassing login dialog! Using pre-set credentials");
        $session->set('ip_addr', $remote_addr);
        $session->set('last_seen', time); 
        my $bypass_result = $self->_login_dialog( {
            'nam' => $site->MFILE_WWW_FORCE_LOGIN_CREDENTIALS->{'nam'},
            'pwd' => $site->MFILE_WWW_FORCE_LOGIN_CREDENTIALS->{'pwd'},
        }, $session );
        $meta->set('META_LOGIN_BYPASS_STATE', 1);
        return $bypass_result;
    }

    #
    # expired session - pass it on only if method is GET, in which # case _render_response_html() will display the login dialog
    #
    if ( $session->get('currentEmployee') and
         $session->get('ip_addr') and 
         $session->get('ip_addr') eq $remote_addr and
         ! _is_fresh( $session ) ) 
    {
        $log->debug( "is_authorized: Expired session " . $session->id );
        $session->expire;
        $session->set('currentEmployee', undef );
        $session->set('last_seen', undef );
        return 0 if $r->method ne 'GET';
        return 1;
    }

    #
    # unauthorized session - if method is GET, return 1 so dhandler.mc
    # can display login dialog
    #
    $session->set('currentEmployee', undef);

    if ( $r->method ne 'GET' ) {
        $log->notice("is_authorized: Rejecting unauthorized session!");
        return 0;
    }
    
    if ( $session->get('last_seen') ) {
        $log->debug( "is_authorized: Unauthorized existing session " . $session->id . " - resetting" );
    } else {
        $log->debug( "is_authorized: New session " . $session->id );
    }

    $session->set('ip_addr', $remote_addr);
    $session->set('last_seen', time); 

    return 1;
}


=head3 _is_fresh

Takes a single argument, which is assumed to be number of seconds since
epoch when the session was last seen. This is compared to "now" and if the
difference is greater than the MFILE_REST_SESSION_EXPIRATION_TIME site
parameter, the return value is false, otherwise true.

=cut

sub _is_fresh {
    my ( $session ) = validate_pos( @_, { type => HASHREF, can => 'id' } );

    return 0 unless my $last_seen = $session->get('last_seen');

    return ( time - $last_seen > $site->MFILE_WWW_SESSION_EXPIRATION_TIME )
        ? 0
        : 1;
}


=head2 known_content_type

Looks at the 'Content-Type' header of POST requests, and generates
a "415 Unsupported Media Type" response if it is anything other than
'application/json'.

=cut

sub known_content_type {
    my ( $self, $content_type ) = @_;

    #$log->debug( "known_content_type" );
    # for GET requests, we don't care about the content
    return 1 if $self->request->method eq 'GET';

    # some requests may not specify a Content-Type at all
    return 0 if not defined $content_type;

    # unfortunately, Web::Machine sometimes sends the content-type
    # as a plain string, and other times as an
    # HTTP::Headers::ActionPack::MediaType object
    if ( ref( $content_type ) eq '' ) {
        return ( $content_type =~ m/application\/json/ ) ? 1 : 0;
    }
    if ( ref( $content_type ) eq 'HTTP::Headers::ActionPack::MediaType' ) {
        return $content_type->equals( 'application/json' ) ? 1 : 0;
    }
    return 0;
}


=head2 malformed_request

This test examines the request body. It can either be empty or contain
valid JSON; otherwise, a '400 Malformed Request' response is returned.
If it contains valid JSON, it is converted into a Perl hashref and 
stored in the 'request_body' attribute of the context.

=cut

sub malformed_request {
    my ( $self ) = @_;
    
    # get the request body, which is UTF-8 ENCODED, so we decode it
    # into a normal Perl scalar
    my $body = decode_utf8( $self->request->content );

    return 0 if not defined $body or $body eq '';
    return 0 if defined $self->context and exists $self->context->{'request_body'};

    $log->debug( "malformed_request: incoming content body ->$body<-" );

    # there is a request body -- attempt to convert it
    my $result = 0;
    try {
        $self->context->{'request_body'} = JSON->new->utf8(0)->decode( $body );
    } 
    catch {
        $log->error( "Caught JSON error: $_" );
        $result = 1;
    };

    if ( $result == 0 ) {
        $log->debug( "malformed_request: body after JSON decode " . 
            ( ( $self->context->{'request_body'}->{'method'} eq 'LOGIN' ) 
                ? 'login/logout request' 
                : Dumper $self->context->{'request_body'} ) );
    }

    return $result;
}



=head2 process_post

AJAX calls come in as POST requests with a JSON body of the following structure:

    { method: "PUT", path: "employee/nick", body: { nick: "bubba", realname: "Bubba Jones" } }

There is one special case: the POST request from the login dialog looks like this:

    { method: "LOGIN", path: "login", body: { nam: 'nick', pwd: 'kcin" } }

This structure represents an HTTP request to the REST server. The request is sent
via the LWP::UserAgent object stored in the session data. The status object received
in the response is forwarded back to the JavaScript side.


=cut

sub process_post {
    my $self = shift;

    my $r = $self->request;
    my $session = Plack::Session->new( $r->{'env'} );
    my $ajax = $self->context->{'request_body'};  # request body (Perl string)

    if ( ! $ajax ) {
        $log->crit( 'POST request received, but without a body' );
        return 0;
    }

    my $method = $ajax->{'method'};
    my $path = $ajax->{'path'};
    my $body = $ajax->{'body'} || {};

    $log->debug( "process_post: method $method, path $path, body " . Dumper $body );

    if ( ! $method or ! $path or ! $body ) {
        $log->crit( 'POST request received, but missing mandatory attribute(s) - ' .
                    'here is the entire request body: ' . Dumper( $ajax ) );
        return 0;
    }

    # two possibilities: login/logout attempt or normal AJAX call
    # - login/logout attempt
    if ( $method =~ m/^LOGIN/i ) {
        $log->debug( "Incoming login/logout attempt" );
        if ( $path =~ m/^login/i ) {
            return $self->_login_dialog( $body, $session );
        } else {
            return $self->_logout( $body, $session );
        }
    }

    # - normal AJAX call
    my $rr = rest_req( $session->get('ua'), {
        server => $site->MFILE_REST_SERVER_URI,
        method => $method,
        path => $path,
        req_body => $body,
    } );
    my $hr = $rr->{'hr'};
    return $self->_prep_ajax_response( $hr, $rr->{'body'} );
}


sub _login_dialog {
    my ( $self, $body, $session ) = @_;
    my $nick = $body->{'nam'};
    my $password = $body->{'pwd'};

    $log->debug( "Entering Resource.pm->_login_dialog" );
    $log->debug( "Authenticating $nick to REST server " . $site->MFILE_REST_SERVER_URI );
   
    if ( ref($session->get('ua')) eq 'LWP::UserAgent' ) {
        $log->debug("_login_dialog: there is already a LWP::UserAgent");
    } else {
        $session->set('ua', LWP::UserAgent->new( 
            cookie_jar => { file => "$ENV{HOME}/.cookies" . $session->id . ".txt" } 
        ) );
        $log->debug( "_login_dialog: User agent created OK" ) if ref($session->get('ua')) eq 'LWP::UserAgent';
    }

    my $rr = rest_req( $session->get('ua'), {
        server => $site->MFILE_REST_SERVER_URI,
        nick => $nick,
        password => $password,
        path => 'employee/current',
    } );
    my $hr = $rr->{'hr'};
    my $body_json = $rr->{'body'};


    my $status;
    if ( $hr->code == 200 ) {
        $session->set( 'currentEmployee', $body_json->{'payload'} );
        $log->debug( "Login successful, currentEmployee is now " . Dumper $body_json->{'payload'} );
        return 1 if $site->MFILE_WWW_BYPASS_LOGIN_DIALOG and ! $meta->META_LOGIN_BYPASS_STATE;
        $status = $CELL->status_ok( 'MFILE_WWW_LOGIN_OK', payload => $body_json->{'payload'} );
    } else {
        $session->set( 'currentEmployee', undef );
        $log->debug( "Login unsuccessful, reset currentEmployee to undef" );
        return 0 if $site->MFILE_WWW_BYPASS_LOGIN_DIALOG and ! $meta->META_LOGIN_BYPASS_STATE;
        $status = $CELL->status_not_ok( 
            'MFILE_WWW_LOGIN_FAIL: %s', 
            args => [ $hr->code ],
            payload => { code => $hr->code, message => $hr->message },
        );
    }
    $self->response->header( 'Content-Type' => 'application/json' );
    $self->response->body( to_json( $status->expurgate ) );
    return 1;
}
         
sub _logout {
    my ( $self, $body, $session ) = @_;
    $log->debug( "mainLogout form handler expiring session " . $session->id );
    init_session( $session );
    $self->response->header( 'Content-Type' => 'application/json' );
    $self->response->body( to_json( $CELL->status_ok( 'MFILE_WWW_LOGOUT_OK' )->expurgate ) );
    return 1;
}

sub _prep_ajax_response {
    my ( $self, $hr, $body_json ) = @_;
    my $expurgated_status;
    if ( $hr->is_success ) {
        $expurgated_status = $body_json;
    } else {
        $expurgated_status = $CELL->status_err( 
            "MFILE_WWW_REST_FAIL: %s", 
            args => [ $hr->code ],
            payload => { code => $hr->code, message => $hr->message },
        )->expurgate;
    }
    $self->response->header('Content-Type' => 'application/json; charset=UTF-8' );
    $self->response->header('Content-Encoding' => 'UTF-8' );
    $self->response->body( JSON->new->encode( $expurgated_status ) );
    return 1;
}

=head3 init_session

Takes a session and an IP address. Initializes the session so it no longer
contains any information that might tie it to the current user.

=cut

sub init_session {
    my ( $session ) = validate_pos( @_, 
        { type => HASHREF, can => 'id' },
    );

    $session->set('eid', undef );
    $session->set('nick', undef );
    $session->set('priv', undef );
    $session->set('ip_addr', undef );
    $session->set('last_seen', undef );
    $session->set('target', undef );
    $session->expire;
    return;
}


=head3 main_html

Takes the session object and returns HTML string to be displayed in the user's
browser.

FIXME: might be worth spinning this off into a separate module.

=cut

sub main_html {
    my ( $ce, $cepriv ) = @_;

    my $r = '<!DOCTYPE html><html>';

    $r .= '<head><meta charset="utf-8">';
    $r .= "<title>App::MFILE::WWW " . $meta->META_MFILE_APPVERSION . "</title>";
    $r .= '<link rel="stylesheet" type="text/css" href="/css/start.css" />';

    # Bring in RequireJS
    $r .= _require_js($ce, $cepriv);

    $r .= '</head>';
    $r .= '<body>';

    # Start the main app logic
    $r .= '<script>require([\'main\']);</script>';

    $r .= '</body>';
    $r .= '</html>';
    return $r;
}


=head3 test_html

Generate html for running unit tests

=cut

sub test_html {
    my ( $ce, $cepriv ) = @_;

    my $r = '';
    
    $r = '<!DOCTYPE html><html>';
    $r .= '<head><meta charset="utf-8">';
    $r .= "<title>App::MFILE::WWW " . $meta->META_MFILE_APPVERSION . " (Unit testing)</title>";
    $r .= '<link rel="stylesheet" type="text/css" href="/css/qunit.css" />';

    # Bring in RequireJS
    $r .= _require_js($ce, $cepriv);

    $r .= '</head><body>';
    $r .= '<div id="qunit"></div>';
    $r .= '<div id="qunit-fixture"></div>';

    # Start unit tests
    $r .= '<script>require([\'test\']);</script>';

    $r .= '</body></html>';
    return $r;
}


# HTML necessary for RequireJS
sub _require_js {
    my ( $ce, $cepriv ) = @_;

    my $r = '';

    $r .= "<script src='" . $site->MFILE_WWW_JS_REQUIREJS . "'></script>";

    $r .= '<script>';

    # configure RequireJS
    $r .= 'require.config({';

    # baseUrl is where we have all our JavaScript files
    $r .= 'baseUrl: "' . $site->MFILE_WWW_REQUIREJS_BASEURL . '",';

    # map 'jquery' module to 'jquery-private.js'
    # (of course, the real 'jquery.js' must be present in 'js/')
    $r .= 'map: {';
    $r .= "    '*': { 'jquery': 'jquery-private' },";
    $r .= "    'jquery-private': { 'jquery': 'jquery' }";
    $r .= '},';

    # path config
    $r .= 'paths: {';
    $r .= '    "app": "../' . $site->MFILE_APPNAME . '",';  # sibling to baseUrl
    $r .= '    "QUnit": "qunit"';                           # in baseUrl
    $r .= '},';

    # QUnit needs some coaxing to work together with RequireJS
    $r .= 'shim: {';
    $r .= '    "QUnit": {';
    $r .= '        exports: "QUnit",';
    $r .= '        init: function () {';
    $r .= '            QUnit.config.autoload = false;';
    $r .= '            QUnit.config.autostart = false;';
    $r .= '        }';
    $r .= '    }';
    $r .= '}';

    # end of require.config
    $r .= "});";

    # initialize configuration parameters that we need on JavaScript side
    $r .= 'requirejs.config({ config: {';
    $r .= '\'cf\': { ';

        # appName, appVersion
        $r .= 'appName: \'' . $site->MFILE_APPNAME . '\',';
        $r .= 'appVersion: \'' . $meta->META_MFILE_APPVERSION . '\',';

        # connectToRestServer (false means "standalone mode")
        $r .= 'connectToRestServer: ' . $meta->META_WWW_CONNECT_TO_REST_SERVER . ',';

        # currentEmployee 
        $r .= "currentUser: " . ( $ce ? to_json( $ce ) : 'null' ) . ',';
        $r .= 'currentUserPriv: \'' . ( $cepriv || 'passerby' ) . '\',';

        # loginDialog
        $r .= 'loginDialogChallengeText: \'' . $site->MFILE_WWW_LOGIN_DIALOG_CHALLENGE_TEXT . '\',';
        $r .= 'loginDialogMaxLengthUsername: ' . $site->MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_USERNAME . ',';
        $r .= 'loginDialogMaxLengthPassword: ' . $site->MFILE_WWW_LOGIN_DIALOG_MAXLENGTH_PASSWORD . ',';

        # dummyParam in last position so we don't have to worry about comma/no comma
        $r .= 'dummyParam: null';

    $r .= '} } });';
    $r .= '</script>';
    return $r;
} 

1;
