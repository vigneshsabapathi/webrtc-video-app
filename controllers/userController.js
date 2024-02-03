const loadIndex = async (req, res) => {
    try {
        res.render('index');
    } catch (err) {
        console.log(error.message);
    }
}

module.exports = {
    loadIndex
}
