// Programs exported here will be available within the demoloader exercise "?exerciseid=demoloader"

//An admin mode where I can set the correct Nodes when creating the string


//Should have assignment
module.exports = [{
    //Print the first 20 even nodes
    "exId": '', "assignment":"Stampa i numeri pari da 0 a 20", "correctNodes":2, "nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":9},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10002,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":9,"parents":[{"id":1,"branch":"main"}],"children":{"main":10},"selected":false,"checked":false,"expressions":["a = 1"],"variables":[{"name":"a","op":"write"}]},{"type":"loop","nodeType":"condition","id":10,"parents":[{"id":9,"branch":"main"}],"children":{"yes":11,"no":10002,"main":-1},"selected":false,"checked":false,"condition":"a < 20","variables":[{"name":"a","op":"read"}]},{"type":"nopNoModal","nodeType":"operation","id":10001,"nopFor":10,"parents":[{"id":12,"branch":"main"}],"children":{"main":10},"selected":false,"checked":false},{"type":"nop","nodeType":"operation","id":10002,"nopFor":10,"parents":[{"id":10,"branch":"no"}],"children":{"main":2},"selected":false,"checked":false},{"type":"expression","nodeType":"operation","id":11,"parents":[{"id":10,"branch":"yes"}],"children":{"main":12},"selected":false,"checked":true,"expressions":["a = a + 2"]},{"type":"output","nodeType":"inputoutput","id":12,"parents":[{"id":11,"branch":"main"}],"children":{"main":10001},"selected":false,"checked":true,"output":"$a \\n"}]},"functions":{"main":{"params":[],"signature":"main"},"ddd":{"params":[],"signature":"ddd()"},"paolo":{"params":[],"signature":"paolo()"}}

},
{
    'exId': '', "assignment":"", "correctNodes":1, "nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":7},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":7,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":7,"parents":[{"id":1,"branch":"main"}],"children":{"main":2},"selected":false,"expressions":["a = 10","b = 5","c = paolo()"]}],"paolo":[{"type":"start","nodeType":"start","id":3,"parents":[],"children":{"main":5},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":4,"parents":[{"id":5,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":5,"parents":[{"id":3,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["a = 12","d = 9"],"variables":[{"name":"a","op":"write"},{"name":"b","op":"write"}]}]},"functions":{"main":{"params":[],"signature":"main"},"ddd":{"params":[],"signature":"ddd()"},"paolo":{"params":[],"signature":"paolo()"}}
}

]