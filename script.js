var api = "bb05488111608f09bfd5f0c89099b773";
// var levels = 5;
// var resource ="radicals";

var userInfo = "https://www.wanikani.com/api/user/"+api+"/user-information";
var chosenKanji = []
var tilesToEndGame;
var amountCorrectTiles = 0;
var lastPressedTile;

var app = angular.module('kanjiApp', []);
app.controller('kanjiCtrl', function($scope, $http, $timeout) {
    
    $scope.resources = ["Kanji","Vocabulary"];
    $http.get(userInfo)
    .then(function(response){
        $scope.user = response.data.user_information.username;
        $scope.availableLevels = response.data.user_information.level;
    });
    // $scope.regexWithComma ="[\d,]";
    // $scope.regexWithoutComma = "[\d]";

    $scope.startGame = function(){
        $scope.gameOn = true;
        var selectedResource = $scope.selectedResource.toLowerCase();
        var adress = "https://www.wanikani.com/api/user/"+api+"/"+selectedResource+"/"+$scope.levels;

        $http.get(adress)
        .then(function (response) {
            var shuffledResponse = shuffle(response.data.requested_information);
            var slicedResponse = shuffledResponse.slice(0,8);

            var kanjiArray = [];
            var meaningArray = [];
        
            for(var i = 0; i<slicedResponse.length; i++) {
                var kanjiObject = {character: slicedResponse[i].character, clicked: false, correct: false, tileId : i, fail: false};
                var meaningObject = {character: slicedResponse[i].meaning, clicked: false, correct: false, tileId : i, fail: false};
            
                kanjiArray.push(kanjiObject);
                meaningArray.push(meaningObject);
            }

            var scopeArray = shuffle(kanjiArray.concat(meaningArray));
        
            tilesToEndGame = scopeArray.length;
            $scope.kanji = scopeArray;});

            $scope.toggleActive = function(chosenTile){
            if(chosenTile != lastPressedTile && !chosenTile.correct) {
                chosenKanji.push(chosenTile);
                chosenTile.clicked = true;
                lastPressedTile = chosenTile;
                compareKanjiInArray($timeout);
            }
        }
    }
});

function compareKanjiInArray($timeout){
    
    if (chosenKanji.length === 2) {
        var tilesMatch = chosenKanji[0].tileId === chosenKanji[1].tileId
        if(tilesMatch) {
            chosenKanji.forEach(function(tile) {
                tile.correct=true;
                amountCorrectTiles++;
                chosenKanji = [];
            }, this);
            if(amountCorrectTiles === tilesToEndGame){
                window.alert("You are winner!");
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

function toggleFailColour(){

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
