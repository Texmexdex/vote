import gradio as gr
import json
from datetime import datetime

# In-memory storage for designs and votes
designs_db = {
    "design_1": {
        "id": "design_1",
        "name": "Classic Chili",
        "image_url": "https://images.unsplash.com/photo-1583224964811-e9c0c9a6c0e3?w=800",
        "votes": 0
    },
    "design_2": {
        "id": "design_2",
        "name": "Spicy Verde",
        "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800",
        "votes": 0
    },
    "design_3": {
        "id": "design_3",
        "name": "White Bean Chili",
        "image_url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
        "votes": 0
    },
    "design_4": {
        "id": "design_4",
        "name": "Texas Red",
        "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
        "votes": 0
    }
}

def get_designs():
    """Return all designs with current vote counts"""
    return list(designs_db.values())

def submit_vote(design_id, previous_vote):
    """
    Submit a vote for a design
    
    Args:
        design_id: ID of the design to vote for
        previous_vote: ID of previous vote (if changing vote)
    
    Returns:
        Dictionary with success status and updated designs list
    """
    # Handle vote change - remove previous vote
    if previous_vote and previous_vote in designs_db:
        designs_db[previous_vote]["votes"] = max(0, designs_db[previous_vote]["votes"] - 1)
    
    # Add new vote
    if design_id in designs_db:
        designs_db[design_id]["votes"] += 1
        return {
            "success": True,
            "designs": list(designs_db.values()),
            "message": f"Vote recorded for {designs_db[design_id]['name']}"
        }
    
    return {
        "success": False,
        "designs": list(designs_db.values()),
        "message": "Invalid design ID"
    }

# Create Gradio interface
with gr.Blocks(title="Design Voting API") as demo:
    gr.Markdown("# Design Voting Backend API")
    gr.Markdown("This API powers the design voting gallery frontend.")
    
    with gr.Tab("Get Designs"):
        gr.Markdown("### Retrieve all designs and vote counts")
        get_btn = gr.Button("Get Designs", variant="primary")
        designs_output = gr.JSON(label="Designs")
        get_btn.click(fn=get_designs, outputs=designs_output)
    
    with gr.Tab("Submit Vote"):
        gr.Markdown("### Submit or change a vote")
        design_id = gr.Textbox(label="Design ID", placeholder="design_1")
        previous_vote = gr.Textbox(label="Previous Vote ID (optional)", placeholder="Leave empty for new vote")
        submit_btn = gr.Button("Submit Vote", variant="primary")
        vote_output = gr.JSON(label="Result")
        submit_btn.click(
            fn=submit_vote,
            inputs=[design_id, previous_vote],
            outputs=vote_output
        )

if __name__ == "__main__":
    demo.launch()
