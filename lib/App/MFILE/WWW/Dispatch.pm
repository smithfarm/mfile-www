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

package App::MFILE::WWW::Dispatch;

use strict;
use warnings;

# methods/attributes not defined in this module will be inherited from:
use parent 'App::MFILE::WWW::Resource';



=head1 NAME

App::MFILE::WWW::Dispatch - app dispatch stub




=head1 SYNOPSIS

TBD



=head1 DESCRIPTION

This is where we override the default version of the is_authorized method
defined by L<Web::Machine::Resource>.

This module is only used in standalone mode. In derived distribution mode, the
application's dispatch module will be used, instead.

=cut




=head1 METHODS


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
    $log->debug( "entering process_post" );

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

    # - normal AJAX call (shown for didactic purposes only; App::MFILE::WWW
    #   itself doesn't generate any AJAX calls)
    my $rr = rest_req( $session->get('ua'), {
        server => $site->MFILE_REST_SERVER_URI || 'http://localhost:5000',
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
    $log->debug( 
        "Authenticating $nick to server " . ( $site->MFILE_REST_SERVER_URI || 'http://localhost:5000' )
    );
   
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

1;
