var  Q       =  require('q');
var  request = require('superagent');
var  debug   = require('debug')('StormAPI');
var  StormAPI = function (user, password, tenant) {
     this.ctx = {};
     this.ctx.user = user;
     this.ctx.password = password;
     this.ctx.tenant = tenant | 293752468;

}

StormAPI.prototype.login = function(){
  debug('API->login')
  var p = new Promise((resolve, reject)=>{

  var url = 'https://stormrunner-load.saas.hpe.com/v1/login?TENANTID=293752468';
  var self = this;
  var ctx = self.ctx;

  request
  .post(url)
  .send({user:ctx.user, password:ctx.password})
  //.set('X-API-Key', 'foobar')
  .set('Accept', 'application/json')
  .end(function(err, res){
    // Calling the end function will send the request

      console.log(`login completed with err ${err}`);
      console.log(`${JSON.stringify(res.body.token)}`);
      if (err)
        reject(err);

      self.ctx.token = res.body.token;
      return resolve();

  });
})
return p;
}

StormAPI.prototype.runTest = function(testId){
  debug('API->runTest');
  var ctx = this.ctx;
  testId = testId || 2;

  var p = new Promise((resolve, reject)=>{

    var url = `https://stormrunner-load.saas.hpe.com/v1/projects/1/tests/${testId}/run?TENANTID=293752468`
    debug(`URL=${url}`);
    debug('--------------------');

    request
    .post(url)
    .set('Cookie', `LWSSO_COOKIE_KEY=${ctx.token}`)

    //.set('X-API-Key', 'foobar')
    .set('Accept', 'application/json')
    .end(function(err, res){
      // Calling the end function will send the request
        console.log(`run test completed with err ${err}`);
        console.log(`${JSON.stringify(res)}`);
        if (err)
        reject(err);
        console.log(`${JSON.stringify(res.body.runId)}`);

        ctx.run =  {};
        ctx.run.runId = res.body.runId;
        return resolve(ctx.run.runId);

    });
 });

 return p;
}
StormAPI.prototype.getStatus = function(retry){

  debug('API->getStatus');
  var ctx = this.ctx;
  var self = this;


  if (retry === 0) return;
  retry--;

  var p = new Promise((resolve, reject)=>{


   var url = `https://stormrunner-load.saas.hpe.com/v1/test-runs/${ctx.run.runId}/status?TENANTID=293752468`;

   request
    .get(url)
    .set('Cookie', `LWSSO_COOKIE_KEY=${ctx.token}`)
    //.set('X-API-Key', 'foobar')
    .set('Accept', 'application/json')
    .end(function(err, res){
      // Calling the end function will send the request
        if (err)
          return reject(err);

        console.log(`run test completed with err ${err}`);
        console.log(`${JSON.stringify(res.body)}`);
         ctx.run.status = res.body.status;

        if (ctx.run.status === "in-progress")
          resolve(retry);

          console.log(`STATUS is = ${JSON.stringify(res.body.status)}`);

        return reject(ctx.run.status);

      });
    });



 return p.then(self.getStatus.bind(self), (status)=>{
   console.log('get status compled with status : '  + status);
   return;

 });

}


module.exports = StormAPI;
