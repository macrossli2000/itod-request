const REQUEST = require("request");
const FS =  require("fs");

function mongoClientsDataStructure(){
    this.service = {
        servicename: '',
        targetcollection: '',
    }
    this.insert = {
        data: undefined
    };
    this.search = {
        //Search Relative
        query: undefined,
        column: undefined,
        sortBy: undefined,
        limit: 0
    };
    this.modify = {
        newvalues: undefined
    };
}

function getFileOverCollectionSize(filename) {
    if (FS.existsSync(filename)){
        const COLLECTIONSIZE = 16;
        const stats =FS.statSync(filename);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
        if (fileSizeInMegabytes >= COLLECTIONSIZE)
            return true;
        else
            return false;
    }else{
        return true;
    }
}

function RequestInfo(){
    this.requesttype = 'normal';
    this.link = {
        //Basic information
        url: '',
        withca: false,
        capath: '',
        method: '',
        additionalheaders: []
    };
    this.information = new mongoClientsDataStructure();
    this.withfile = false;
}

function ReturnFail(ErrMessage, ResultObj){
    this.issuccess = false;
    this.return = ResultObj;
    this.errmessage = ErrMessage;
}

function ReturnSuccess(ResultObj){
    this.issuccess = true;
    this.return = ResultObj;
    this.errmessage = '';
}

function canStartFunction(givenData){
    let localData = new RequestInfo();
    localData = givenData;
    
    if (localData.link.url === ''){
        return new ReturnFail('Url is missing, please fill in link.Url', givenData);
    }else if (localData.link.WithCA && localData.link.CAPath === ''){
        return new ReturnFail('CA path is missing, please fill in link.CAPath', givenData);
    }else if (localData.information === undefined || localData.information === null){
        return new ReturnFail('Information is missing, please fill in information', givenData); 
    }else{
        if (givenData.requesttype === undefined || givenData.requesttype === null || givenData.requesttype === 'normal'){
            return new ReturnSuccess(localData);
        }else if (localData.information.service === undefined || localData.information.service === null){
            return new ReturnFail('Database connection information is missing, please fill in information.connection', givenData); 
        }else if (localData.information.service.servicename === '' || localData.information.service.servicename === undefined || localData.information.service.servicename === null){
            return new ReturnFail('Database connection information is missing, please fill in information.connection.servicename', givenData); 
        }else if (localData.information.service.targetcollection === '' || localData.information.service.targetcollection === undefined || localData.information.service.targetcollection === null){
            return new ReturnFail('Database connection information is missing, please fill in information.connection.targetcollection', givenData); 
        }        
        //Insert Data by create request to DB server
        switch (givenData.requesttype){
            case "insert":
                if (localData.information.insert === undefined || localData.information.insert === null){
                    return new ReturnFail('No information.insert has been given', givenData); 
                }else if (localData.information.insert.data === undefined || localData.information.insert.data === null){
                    return new ReturnFail('No information.insert.data has been given', givenData); 
                }else if (localData.withfile){
                    if (localData.information.data !== undefined && localData.information.data.path !== undefined){
                        if (getFileOverCollectionSize(localData.information.data.path)){
                            return new ReturnFail('Upload file over 16Mb or file is missing', givenData); 
                        }
                    }else{
                        return new ReturnFail('File not found, please fill in information.data', givenData);
                    }
                }
                break;
            case "search", "delete":
                if (localData.information.search === undefined || localData.information.search === null){
                    return new ReturnFail('No information.search has been given', givenData); 
                }else if (localData.information.search.query === undefined || localData.information.search.query === null){
                    return new ReturnFail('No information.search.query has been given', givenData); 
                }
                break;
            case "modify":
                if (localData.information.search === undefined || localData.information.search === null){
                    return new ReturnFail('No information.search has been given', givenData); 
                }else if (localData.information.search.query === undefined || localData.information.search.query === null){
                    return new ReturnFail('No information.search.query has been given', givenData); 
                }else if (localData.information.modify === undefined || localData.information.modify === null){
                    return new ReturnFail('No information.modify has been given', givenData); 
                }else if (localData.information.modify.newvalues === undefined || localData.information.modify.newvalues === null){
                    return new ReturnFail('No information.modify.newvalues has been given', givenData); 
                }
                break;
            case "backup":
                if (localData.information.search === undefined || localData.information.search === null){
                    return new ReturnFail('No information.search has been given', givenData); 
                }else if (localData.information.search.query === undefined || localData.information.search.query === null){
                    return new ReturnFail('No information.search.query has been given', givenData); 
                }else if (localData.information.backup === undefined || localData.information.backup === null){
                    return new ReturnFail('No information.backup has been given', givenData); 
                }else if (localData.information.backup.collection === undefined || localData.information.backup.collection === null){
                    return new ReturnFail('No information.backup.collection has been given', givenData); 
                }
                break;
        }
        return new ReturnSuccess(localData);
    }
}

function createRequestOption(givenData){
    let headerinfo = {};
    let options = {
        url: givenData.link.url,
        method: givenData.link.method,
        headers: headerinfo
    };

    if (givenData.link.withca && givenData.link.capath != ''){
        options.rejectUnauthorized = true;
        options.ca =  FS.readFileSync(givenData.link.capath)
    } else {
        options.rejectUnauthorized = false;
    }

    if (givenData.information === null || givenData.information === undefined){
        headerinfo['content-type'] = 'application/json';
        options.json = {};
    }else{
        if (givenData.withfile){
            headerinfo['content-type'] = 'multipart/form-data';
            options.formData = givenData.information;
        }else{
            headerinfo['content-type'] = 'application/json';
            options.json = givenData.information;
        }
    }
    if (!(givenData.link.additionalheaders === undefined || givenData.link.additionalheaders === null)){
        if (Array.isArray(givenData.link.additionalheaders)){
            for (let i=0; i<givenData.link.additionalheaders.length; i++){
                headerinfo[givenData.link.additionalheaders[i].header] = givenData.link.additionalheaders[i].value;
            }
        }
    }
    givenData.options = options;
}

function createRequest(givenData){
    return new Promise(resolve =>  {
        createRequestOption(givenData);
        try{
            REQUEST(givenData.options, function (error, response, body) 
            {
                var ErrMessage = '';
                var statusCode;
                if (response !== null && response !== undefined && response.statusCode !== null && response.statusCode !== undefined){
                    statusCode = parseInt(response.statusCode.toString(), 10);
                }else{
                    statusCode = 999;
                }
                if (!error) 
                {   
                    if (statusCode >= 200 && statusCode < 400){
                        resolve(new ReturnSuccess(body));
                    }else{
                        //ErrMessage = 'Incorrect status code:' + statusCode;
                        if (typeof body === 'Object'){
                            //{ code: 'MethodNotAllowed', message: 'GET is not allowed' }
                            if (body.message !== undefined){
                                ErrMessage = body.message
                            }else{
                                ErrMessage = body.toString();
                            }
                        }else{
                            ErrMessage = body;
                        }
                        resolve(new ReturnFail(ErrMessage, null));
                    }
                }
                else 
                {
                    try{
                        
                        if (error != null && error != undefined){
                            ErrMessage = statusCode + ',' + error;
                        } else if (body != null || body != undefined){
                            ErrMessage = statusCode + ',' + body.toString();
                        }else{
                            ErrMessage = statusCode + ', incorrect request';
                        }
                        resolve(new ReturnFail(ErrMessage, null));
                    }catch(ex){
                        //ErrMessage = ex.message;
                        resolve(new ReturnFail(ex.message, null));
                    }
                }
            });
        }catch(ex){
            resolve(new ReturnFail(ex.message, ex));
        }
    });
}

//-------------------------------------------------------------------------------
class RaiseRequest{
    constructor(givenData) {
        this.info = new RequestInfo();
        this.info.requesttype = givenData.requesttype;
        this.info.link.url = givenData.url;
        this.info.link.withca = givenData.withca;
        this.info.link.capath = givenData.capath;
        this.info.link.method = givenData.method;
        this.info.link.additionalheaders = givenData.additionalheaders;
        this.info.information = givenData.information;
        this.info.withfile = givenData.withfile;
        let returnResult = canStartFunction(this.info);
        if (!returnResult.issuccess){
            this.info = undefined;
            throw new Error(returnResult.errmessage);
        }
    }

    post(){
        return new Promise(resolve =>  {
            if (this.info.link.method == undefined || this.info.link.method === null || this.info.link.method === ''){
                this.info.link.method = 'POST';
            }
            createRequest(this.info).then(
                function (createRequestResult){
                    resolve(createRequestResult);
                }
            );
        });
    }
    
    get(){
        return new Promise(resolve =>  {
            if (this.info.link.method == undefined || this.info.link.method === null || this.info.link.method === ''){
                this.info.link.method = 'GET';
            }
            createRequest(this.info).then(
                function (createRequestResult){
                    resolve(createRequestResult);
                }
            );
        });
    }
    
    put(){
        return new Promise(resolve =>  {
            if (this.info.link.method == undefined || this.info.link.method === null || this.info.link.method === ''){
                this.info.link.method = 'PUT';
            }
            createRequest(this.info).then(
                function (createRequestResult){
                    resolve(createRequestResult);
                }
            );
        });
    }
    
    del(){
        return new Promise(resolve =>  {
            if (this.info.link.method == undefined || this.info.link.method === null || this.info.link.method === ''){
                this.info.link.method = 'DELETE';
            }
            createRequest(this.info).then(
                function (createRequestResult){
                    resolve(createRequestResult);
                }
            );
        });
    }

}

exports.RaiseRequest = RaiseRequest;