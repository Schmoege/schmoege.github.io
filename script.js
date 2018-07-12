var api;
var chosenKanji = []
var tilesToEndGame;
var amountCorrectTiles = 0;
var lastPressedTile;

var app = angular.module('kanjiApp', ['ngCookies']);
app.controller('kanjiCtrl', function($scope, $http, $timeout, $cookies) {
    
    $scope.restart = function(){
        $scope.gameWon = false;
        $scope.gameOn = false;
        amountCorrectTiles = 0;
        kanjiArray = [];
        meaningArray = [];
    }
    var apiCookie = $cookies.get('apiKey'); //Om api är sparad, hämta cookie och sätt input som dett
    if(apiCookie != null) {
        $scope.apiKey = apiCookie;
        $scope.rememberApiKey = true;
    }

    $scope.resources = ["Kanji","Vocabulary","Radicals"];
    $scope.showHideLevelInput = function(){
        if($scope.selectedResource === "Radicals") {
            $scope.radicalsSelected = true;
        }
        else {
            $scope.radicalsSelected = false;
        }
    }

    $scope.getUserInfo = function(){ //Hämta namn och tillgängliga nivåer
        getUserInfo($scope, $http, $cookies);
    }
    
    $scope.startGame = function(){
        $scope.loading = true;

        var selectedResource = $scope.selectedResource.toLowerCase(); //
        var levels = $scope.levels;
        if (!levels) {
            levels ="";
        }
        var adress = "https://www.wanikani.com/api/user/"+api+"/"+selectedResource+"/"+levels;

        $http.get(adress)
        .then(function (response) {

            $scope.gameWon = false;
            $scope.gameOn = true;

            $scope.errorMessage = false;
            var shuffledResponse = [];
            if(selectedResource === "vocabulary" && !levels){
                shuffledResponse = shuffle(response.data.requested_information.general); //API-relaterat
            }
            else {
                shuffledResponse = shuffle(response.data.requested_information);
            }
            
            if(selectedResource === "radicals") {
                for(var i = 0; i<shuffledResponse.length; i++){
                    if(shuffledResponse[i].user_specific.srs === "burned") {
                        shuffledResponse.splice(i,1);
                    }
                }
            }

            var slicedResponse = shuffledResponse.slice(0,6);

            var kanjiArray = [];
            var meaningArray = [];
        
            for(var i = 0; i<slicedResponse.length; i++) {
                var kanjiObject = {character: slicedResponse[i].character, clicked: false, correct: false, tileId : i, fail: false};
                if(kanjiObject.character === null){ //Om radicals är valt och ingen unicode finns för symbolen
                    kanjiObject.imgUrl = slicedResponse[i].image;
                }
                var meaningToBeSliced = slicedResponse[i].meaning;
                var meaningPart = meaningToBeSliced.split(",");
                var meaningObject = {character: meaningPart[0], clicked: false, correct: false, tileId : i, fail: false};
            
                kanjiArray.push(kanjiObject);
                meaningArray.push(meaningObject);
            }

            var scopeArray = shuffle(kanjiArray.concat(meaningArray));
        
            tilesToEndGame = scopeArray.length;
            $scope.kanji = scopeArray;});

            $scope.loading = false;

            $scope.toggleActive = function(chosenTile){
            if(chosenTile != lastPressedTile && !chosenTile.correct) {
                chosenKanji.push(chosenTile);
                chosenTile.clicked = true;
                lastPressedTile = chosenTile;
                compareKanjiInArray($timeout, $scope);
            }
        }, //error
        function(error){
            $scope.errorMessage = true;
            var errorDiv = clearAndGetErrorDiv();
            errorDiv.innerHTML = "Failed getting the requested resources from WaniKani. Either WaniKani is under maintenance or something has fucked up big time. Please try again and good luck.";
        }
    }
});

function getUserInfo($scope, $http, $cookies) {
    $scope.loading = true;

    api = $scope.apiKey;
    var userInfo = getUserInfoUrl(api);
    
    $http.get(userInfo)
    .then(function(response){
        $scope.user = response.data.user_information.username;
        $scope.availableLevels = response.data.user_information.level;
        $scope.apiSuccessfullyRetrieved = true;
        if($scope.rememberApiKey === true){
            $cookies.put('apiKey',api);
        }
        $scope.errorMessage = false;
    }, //vid error
    function(error) {
        $scope.errorMessage = true;
        var errorDiv = clearAndGetErrorDiv();
        errorDiv.innerHTML = "The API key is not valid or WaniKani is undergoing maintenance. Please check your key or wait until the maintenance is over.";
    });

    $scope.loading = false;
}

function compareKanjiInArray($timeout, $scope){
    
    if (chosenKanji.length === 2) {
        var tilesMatch = chosenKanji[0].tileId === chosenKanji[1].tileId
        if(tilesMatch) {
            chosenKanji.forEach(function(tile) {
                tile.correct=true;
                amountCorrectTiles++;
                chosenKanji = [];
            }, this);
            if(amountCorrectTiles === tilesToEndGame){
                $scope.gameWon = true;
            }
        }
        else{
            chosenKanji[0].fail = true;
            chosenKanji[1].fail = true;
            $timeout(function(){
                resetFailedTiles();
                lastPressedTile = undefined;
                chosenKanji[0].fail = false;
                chosenKanji[1].fail = false;
                chosenKanji = [];
            },1000);
        }
    } 
}

function resetFailedTiles() {
    chosenKanji.forEach(function(tile) {
        tile.clicked=false;
    }, this);
}


//Fisher-Yates shuffle
function shuffle(array) {
    let counter = array.length;
    //let = scope är i functionen
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);
    
        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}
function getUserInfoUrl(apiString) {
    return "https://www.wanikani.com/api/user/"+apiString+"/user-information";
}
function clearAndGetErrorDiv(){
    var errordiv = document.getElementById("errorMessage");
    errordiv.innerHTML = "";
    return errordiv;
}