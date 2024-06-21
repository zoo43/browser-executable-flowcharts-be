//Convert test here and export, hope

let test = []

function changeTest(par)
{
    test = par
    return test
}

function getTest()
{
    return test
}

module.exports = {
    test,
    changeTest,
    getTest
}
