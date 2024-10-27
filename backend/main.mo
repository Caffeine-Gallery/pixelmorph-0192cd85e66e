import Nat "mo:base/Nat";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Nat8 "mo:base/Nat8";
import Error "mo:base/Error";

actor {
    // Stable variable to store avatars
    stable var avatarHistory : [Blob] = [];
    let maxHistorySize : Nat = 10;

    // Public function to store avatar
    public shared func storeAvatar(avatarBlob: Blob) : async ?Blob {
        try {
            // Store in history
            if (avatarHistory.size() >= maxHistorySize) {
                // Remove oldest avatar if we've reached max size
                avatarHistory := Array.tabulate<Blob>(maxHistorySize - 1, func(i) {
                    avatarHistory[i + 1]
                });
            };
            
            avatarHistory := Array.append<Blob>(avatarHistory, [avatarBlob]);
            
            return ?avatarBlob;
        } catch (err) {
            Debug.print("Error in storeAvatar: " # Error.message(err));
            return null;
        };
    };

    // Public query to get avatar history
    public query func getAvatarHistory() : async [Blob] {
        return avatarHistory;
    };

    // System functions for upgrade persistence
    system func preupgrade() {
        // avatarHistory is already stable, so no action needed
    };

    system func postupgrade() {
        // avatarHistory will be automatically restored
    };
}
