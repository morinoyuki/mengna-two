const { default: axios } = require("axios")

const key = 'ba699e8df51ceff5e37aeb5f9ff432e6'

async function submitRemoteImage(url) {
    const { data } = await axios.get(`https://www.moderatecontent.com/api/v2?key=${key}&url=${encodeURI(url)}`)
    return data
}
async function isAdult(url) {
    try {
        const data = await submitRemoteImage(url)
        if (data.error_code !== 0) return false
        if (data.rating_index === 3) return true
        else return false
    } catch {
        return false
    }
}
async function getData(url) {
    return await submitRemoteImage(url)
}
exports.getData = getData
exports.isAdult = isAdult