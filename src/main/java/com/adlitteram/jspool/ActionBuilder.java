package com.adlitteram.jspool;

import com.adlitteram.jspool.gui.actions.ModifyChannel;
import com.adlitteram.jspool.gui.actions.Quit;
import com.adlitteram.jspool.gui.actions.StopAllChannels;
import com.adlitteram.jspool.gui.actions.StopChannel;
import com.adlitteram.jspool.gui.actions.StartChannel;
import com.adlitteram.jspool.gui.actions.DestroyChannel;
import com.adlitteram.jspool.gui.actions.LowerChannel;
import com.adlitteram.jspool.gui.actions.ShowLogArea;
import com.adlitteram.jspool.gui.actions.About;
import com.adlitteram.jspool.gui.actions.UpperChannel;
import com.adlitteram.jspool.gui.actions.NewChannel;
import com.adlitteram.jspool.gui.actions.StartAllChannels;
import com.adlitteram.jspool.gui.actions.DisableChannel;
import com.adlitteram.jspool.gui.actions.Preferences;
import com.adlitteram.jspool.gui.actions.ResetLogArea;
import com.adlitteram.jspool.gui.actions.EnableChannel;
import com.adlitteram.jspool.gui.actions.CopyChannel;
import com.adlitteram.jasmin.action.ActionManager;
import com.adlitteram.jasmin.action.XAction;

public class ActionBuilder extends ActionManager {

    public ActionBuilder() {
        super();
        putActions(getActions());
    }

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
