const adultCheck = require('../plugins/utils/adultCheck').submitRemoteImage

adultCheck('https://pbs.twimg.com/media/EhEap8DU0AA0Z7k?format=jpg&name=900x900').then(bool => {
    console.log(bool)
})