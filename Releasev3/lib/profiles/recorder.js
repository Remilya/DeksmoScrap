// part of KellyFavItems extension

var KellyProfileRecorder = new Object();
    KellyProfileRecorder.create = function() {
        
        KellyProfileRecorder.self = new KellyProfileDefault();   
        var handler = KellyProfileRecorder.self;
        
        handler.profile = 'recorder';    
        handler.extLinks = {
        
            pp : 'https://github.com/Remilya/DeksmoScrap',
            github : 'https://github.com/Remilya/DeksmoScrap',
            
            install_ff : 'https://github.com/Remilya/DeksmoScrap',
            install_chrome : 'https://github.com/Remilya/DeksmoScrap',
            install_edge : 'https://github.com/Remilya/DeksmoScrap',
            install_opera : 'https://github.com/Remilya/DeksmoScrap',
            
            author : 'https://Deksmo.com',
        };
    }
    
    KellyProfileRecorder.getInstance = function() {
        if (typeof KellyProfileRecorder.self == 'undefined') KellyProfileRecorder.create();    
        return KellyProfileRecorder.self;
    }