/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool;

//import com.adlitteram.jasmin.action.ActionManager;
//import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jasmin.action.ActionManager;
import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.actions.*;

public class ActionBuilder extends ActionManager {

    public ActionBuilder() {
        super();
        putActions(getActions());
    }
    // Init Actions

    public static XAction[] getActions() {
        return new XAction[]{
                    new About(),
                    new StartAllChannels(),
                    new StopAllChannels(),
                    new ShowLogArea(),
                    new ResetLogArea(),
                    new Preferences(),
                    new Quit(),
                    new NewChannel(),
                    new CopyChannel(),
                    new StopChannel(),
                    new StartChannel(),
                    new UpperChannel(),
                    new LowerChannel(),
                    new DisableChannel(),
                    new EnableChannel(),
                    new ModifyChannel(),
                    new DestroyChannel()};
    }
}
