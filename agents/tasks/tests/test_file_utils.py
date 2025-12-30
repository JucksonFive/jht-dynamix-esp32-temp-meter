import pytest
from unittest.mock import patch
from pathlib import Path
from agents.tasks.src.file_utils import save_coder_output, save_ticket_to_file

@pytest.fixture
def mock_dirs(tmp_path):
    tickets_dir = tmp_path / "tickets"
    tickets_dir.mkdir()
    coder_output_dir = tmp_path / "coder_output"
    coder_output_dir.mkdir()
    return tickets_dir, coder_output_dir

def test_save_coder_output_with_existing_ticket(mock_dirs):
    tickets_dir, coder_output_dir = mock_dirs
    
    # Create a dummy ticket file matching the pattern
    ticket_num = 123
    ticket_file = tickets_dir / "123-awesome-feature.md"
    ticket_file.touch()
    
    content = "Plan content"
    
    with patch("agents.tasks.src.file_utils.TICKETS_DIR", tickets_dir), \
         patch("agents.tasks.src.file_utils.CODER_OUTPUT_DIR", coder_output_dir):
        
        output_path = save_coder_output(ticket_num, content)
        
        # Expect filename to include the ticket name
        expected_filename = "123-awesome-feature-coder-plan.md"
        assert output_path.name == expected_filename
        assert output_path.read_text(encoding="utf-8") == content

def test_save_coder_output_without_existing_ticket(mock_dirs):
    tickets_dir, coder_output_dir = mock_dirs
    
    # No ticket file created for this number
    ticket_num = 456
    content = "Plan content"
    
    with patch("agents.tasks.src.file_utils.TICKETS_DIR", tickets_dir), \
         patch("agents.tasks.src.file_utils.CODER_OUTPUT_DIR", coder_output_dir):
        
        output_path = save_coder_output(ticket_num, content)
        
        # Expect fallback filename
        expected_filename = "456-coder-plan.md"
        assert output_path.name == expected_filename
        assert output_path.read_text(encoding="utf-8") == content

def test_save_ticket_to_file(mock_dirs):
    tickets_dir, _ = mock_dirs
    
    content = "## Ticket: New Feature\nDescription..."
    ticket_num = 1
    
    with patch("agents.tasks.src.file_utils.TICKETS_DIR", tickets_dir):
        output_path = save_ticket_to_file(content, ticket_num)
        
        assert output_path.name == "001-new-feature.md"
        assert output_path.read_text(encoding="utf-8") == content
