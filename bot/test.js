const axios = require('axios').default;

axios.get('https://chp.shadiao.app/api.php', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
    }
}).then((data)=>{
    console.log(data.data);
});