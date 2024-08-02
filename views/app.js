document.addEventListener('alpine:init', () => {
    Alpine.data('pageUtils', () => ({
        isLoggedIn: false,
        messageBoxHtml: '',
        messageBoxType: 'info',
        loginUsername: '',
        loginPassword: '',
        showToast: false,
        toastMessage: '',
        toastTitle: 'Success',
        toastType: 'success',
        limit: 10,
        filter: '',
        term: '',
        slideOverOpen: false,
        user: {},
        toastList: [],
        async init() {
            const user = localStorage.getItem('user')
            const toastElList = [].slice.call(document.querySelectorAll('.toast'))
            this.toastList = toastElList.map((toastEl) => {
                return new bootstrap.Toast(toastEl) // No need for options; use the default options
            });
            if (!user) {
                this.setLoginForm()
            } else {
                this.user = JSON.parse(user)
                this.messageBoxType = 'info'
                this.messageBoxHtml = 'Checking credentials'
                this.isLoggedIn = await this.checkToken(this.user.token)
            }
            if (this.isLoggedIn) {
                const app = document.getElementById('app')
                app.setAttribute(
                    'hx-headers',
                    `{"Authentication": "Bearer: ${this.user.token}"}`,
                )
            }
        },
        setLoginForm() {
            this.messageBoxType = 'error'
            this.messageBoxHtml =
                '<p>You are not logged in. Please use the login form below to access this page.</p><div class="row"><div class="col-6"><label for="username">Username</label><input id="username" class="form-control" type="text" x-model="loginUsername"/></div><div class="col-6"><label for="password">Password</label><input id="password" class="form-control" type="password" x-model="loginPassword" @keyup.enter="login"/></div></div><div class="d-flex flex-row-reverse"><button class="btn btn-primary mt-2" @click="login">Login</button></div>'
        },
        async login() {
            try {
                const response = await axios({
                    url: 'https://ofditprojects.sps.cuny.edu/api/login',
                    method: 'post',
                    data: {
                        username: this.loginUsername,
                        password: this.loginPassword,
                    },
                })
                this.user = response.data
                localStorage.setItem('user', JSON.stringify(response.data))
                this.sendNotification(
                    `Greetings ${this.user.first_name}, you have successfully logged in.`,
                )
                this.init()
            } catch (err) {
                if (err.response.status === 400) {
                    this.sendNotification(
                        'Please check that you have entered both your username & password.',
                        'error',
                        'Error',
                    )
                }
                if (err.response.status === 401) {
                    this.sendNotification(
                        'The login server rejected your credentials. Please try again. If you cannot login, please contact OFDIT.',
                        'error',
                        'Error',
                    )
                }
                if (err.response.status === 500) {
                    this.sendNotification(
                        'The login server is down. Please contact OFDIT if this continues.',
                        'error',
                        'Error',
                    )
                }
            }
        },
        async checkToken(token) {
            try {
                const response = await axios({
                    url: 'https://ofditprojects.sps.cuny.edu/api/login/check-token',
                    method: 'post',
                    data: {
                        user_token: token,
                    },
                })
                this.user = response.data
                localStorage.setItem('user', JSON.stringify(response.data))
                this.sendNotification(
                    `Greetings ${this.user.first_name}, you have successfully logged in.`,
                )
                return true
            } catch (err) {
                this.setLoginForm()
            }
            return false
        },
        async sendNotification(
            message,
            messageType = 'success',
            toastTitle = 'Success',
        ) {
            this.toastMessage = message
            this.toastType = messageType
            this.toastTitle = toastTitle
            this.toastList.forEach(toast => toast.show())
        },
        async copyToClipboard(value) {
            await navigator.clipboard.writeText(value)
            this.sendNotification(`Wrote <strong>${value}</strong> to the clipboard.`)
        },
    }))
})
