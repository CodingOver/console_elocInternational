document.addEventListener('DOMContentLoaded', function () {
    var modeSwitch = document.querySelector('.mode-switch');
    modeSwitch.addEventListener('click', function () {                     
        document.documentElement.classList.toggle('dark');
        modeSwitch.classList.toggle('active');
    });
    
    var listView = document.querySelector('.list-view');
    var gridView = document.querySelector('.grid-view');
    var projectsList = document.querySelectorAll('.project-boxes');
    
    
    
    if (listView) {
        listView.addEventListener('click', function () {
            gridView.classList.remove('active');
            listView.classList.add('active');
            
            projectsList.forEach(function (list) {
                list.classList.remove('jsGridView');
                list.classList.add('jsListView');
            })
            
        });
    }
    if (gridView) {
        gridView.addEventListener('click', function () {
            gridView.classList.add('active');
            listView.classList.remove('active');
    
            projectsList.forEach(function(grid){
                grid.classList.remove('jsListView');
                grid.classList.add('jsGridView');
            })
            
        });
    }
    
    
});
