
## Internal operators and variables : 

* _srcDir : the spooled directory (String)

* _srcFile : the file found (SourceFile) 

* _localScript : the current script (LocalScript)

* _channel : the current channel (Channel)

* _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 
* _print : print the value
 
* _getValue : get the value from key

* _setValue : set a key and value

* _exec : execute the external process

## Note 

Beware not to use reserved keyword. ex. file.delete => file["delete"] )
