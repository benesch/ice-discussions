(function() {
	
var exports = this, IceDiscussionsPlugin;
	
IceDiscussionsPlugin = function(ice_instance) {
	this._ice = ice_instance;
	
	this.discussionAdded = function() {};
	this.discussionSelected = function() {};
	
	ice_instance.addChangeType('discussionType', 'discussion', 'dis', 'Discussion started');
	
	ice.InlineChangeEditor.prototype.discussion = this._bind(this.discussion);
	ice.InlineChangeEditor.prototype.resolvediscussion = this._bind(this.resolvediscussion);
};

IceDiscussionsPlugin.prototype = {
	setSettings: function(settings) {
		settings = settings || {};
		ice.dom.extend(this, settings);
	},
	
	discussion: function(range) {
		if(range) this._ice.selection.addRange(range);
		else range = this._ice.getCurrentRange();
		
		//if nothing's selected, select one character to right so we have an "anchor" for the discussion
		if (range.collapsed) range.moveCharRight(false, 1);

		if (!this._validRange(range)) return false;
		
		var changeid = this._ice.startBatchChange();
		
		//stuff the contents of the selection into a discussion node
		var node = this._ice.createIceNode('discussionType', node);
		node.appendChild(range.extractContents());
		range.insertNode(node);
		
		this._ice.selection.addRange(range);
		this._ice.pluginsManager.fireNodeInserted(node, range);
		this.discussionAdded(changeid);
		
		this._ice.endBatchChange(changeid);
		
		return true;
	},
	
	resolvediscussion: function(node) {
		var selector, trackNode, changes, dom = ice.dom;

		if(!node) {
			var range = this._ice.getCurrentRange();
			if(!range.collapsed) return;
			else node = range.startContainer;
		}

		var selector = '.' + this._ice._getIceNodeClass('discussionType');
		trackNode = dom.getNode(node, selector);
		// Some changes are done in batches so there may be other tracking
		// nodes with the same `changeIdAttribute` batch number.
		changes = dom.find(this._ice.element, '[' + this._ice.changeIdAttribute + '=' + dom.attr(trackNode, this._ice.changeIdAttribute) + ']');

		dom.each(changes, function(i, node) {
			dom.replaceWith(node, ice.dom.contents(node));
		});
	},
	
	caretUpdated: function() {
		var range = this._ice.getCurrentRange();
		var ctNode = this._ice.getIceNode(range.startContainer, 'discussionType');
		var id = ctNode ? ctNode.getAttribute(this._ice.changeIdAttribute) : -1;
		
		this.discussionSelected(Number(id));
	},
	
	selectionChanged: function() {
		this.caretUpdated();
	},
	
	//for simplicity, discussion ranges cannot contain block-level elements
	_validRange: function(range) {
		var bookmark = new ice.Bookmark(this._ice.env, range),
			elements = ice.dom.getElementsBetween(bookmark.start, bookmark.end),
			eln = elements.length;

		for (var i = 0; i < eln; i++) {
			if(ice.dom.is(elements[i], this._ice.blockEl))
				return false;
		}
				
		return true;
	},
	
	_bind: function(method) {
		var self = this;
		return function() {
			return method.apply(self, arguments);
		}
	}
};

ice.dom.noInclusionInherits(IceDiscussionsPlugin, ice.IcePlugin);
exports._plugin.IceDiscussionsPlugin = IceDiscussionsPlugin;

}).call(this.ice);