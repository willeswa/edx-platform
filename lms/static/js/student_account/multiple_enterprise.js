(function(define) {
    'use strict';
    define(['jquery', 'js/student_account/utils', 'jquery.cookie'], function($, Utils) {
        var MultipleEnterpriseInterface = {

            urls: {
                learners: '/enterprise/api/v1/enterprise-learner/',
                multipleEnterpriseUrl: '/enterprise/select/active/?success_url=',
                enterpriseActivationUrl: '/enterprise/select/active'
            },

            headers: {
                'X-CSRFToken': $.cookie('csrftoken')
            },

            /**
             * Fetch the learner data, then redirect the user to a enterprise selection page if multiple
             * enterprises were found.
             * @param  {string} nextUrl The URL to redirect to after multiple enterprise selection or incase
             * the selection page is bypassed e.g. when dealing with direct enrolment urls.
             */
            check: function(nextUrl) {
                var view = this;
                var selectionPageUrl = this.urls.multipleEnterpriseUrl + encodeURIComponent(nextUrl);
                var username = Utils.userFromEdxUserCookie().username;
                var next = nextUrl || '/';
                var enterpriseInUrl = this.getEnterpriseFromUrl(nextUrl);
                $.ajax({
                    url: this.urls.learners + '?username=' + username,
                    type: 'GET',
                    contentType: 'application/json; charset=utf-8',
                    headers: this.headers,
                    context: this
                }).fail(function() {
                    view.redirect(next);
                }).done(function(response) {
                    const userWithMultipleEnterprises =  (response.count > 1) ? true : false;
                    if (userWithMultipleEnterprises) {
                        if ( enterpriseInUrl) {
                            const userInEnterprise = view.checkEnterpriseExists(response, enterpriseInUrl);
                            if (userInEnterprise) {
                                view.activate(enterpriseInUrl).fail(function()  {
                                    view.redirect(selectionPageUrl);
                                }).done(function()  {
                                    view.redirect(next);
                                });
                            }
                            else {
                                view.redirect(selectionPageUrl);
                            }
                        }
                        else {
                            view.redirect(selectionPageUrl);
                        }
                    }
                    else {
                        view.redirect(next);
                    }
                });
            },

            redirect: function(url) {
                window.location.href = url;
            },

            activate: function(enterprise) {
                return $.ajax({
                    url: this.urls.enterpriseActivationUrl,
                    method: 'POST',
                    headers: {'X-CSRFToken': $.cookie('csrftoken')},
                    data : { enterprise : enterprise }
                });
            },

            getEnterpriseFromUrl: function(url) {
                var regex;
                regex = RegExp('\/enterprise\/.*\/course\/.*\/enroll')
                if (typeof url !== 'string' || !regex.test(url)) {
                    return void(0);
                }
                return url.split("/")[2];
            },

            checkEnterpriseExists: function(response, enterprise) {
                var enterpriseInResponse = false;
                for (var i = 0; i < response.count; i++) {
                    if (enterprise == response.results[i].enterprise_customer.uuid) {
                        enterpriseInResponse = true;
                    }
                }
                return enterpriseInResponse;
            }
        };

        return MultipleEnterpriseInterface;
    });
}).call(this, define || RequireJS.define);
