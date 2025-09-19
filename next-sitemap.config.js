/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://caja.clancig.com.ar',
    generateRobotsTxt: true, 
    robotsTxtOptions: {
        policies: [
            { userAgent: '*', allow: '/' },
        ]
    },
    exclude: ['/add-transaction', '/edit-transaction/*', '/add-tax', '/edit-tax/*', '/settings/*', '/savings-funds/*', '/goodbye'],
};
